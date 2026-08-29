import HealthRecord from '../models/HealthRecord.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import {
  getUserDateTime,
  isValidDateString,
  addDaysToDate,
  getDateRangeArray,
  combineDateAndTimeToUTC,
} from '../utils/dateTime.js';

export const METRIC_UNITS = {
  weight: 'kg',
  bloodPressure: 'mmHg',
  bloodSugar: 'mg/dL',
  heartRate: 'BPM',
  temperature: '°C',
};

export const ALLOWED_METRICS = [
  'weight',
  'bloodPressure',
  'bloodSugar',
  'heartRate',
  'temperature',
  'all',
];

export const ALLOWED_PERIODS = ['7d', '30d', '90d', 'custom'];

/**
 * Rounds a number to a specific number of decimal places
 * @param {number|null} num
 * @param {number} [decimals=2]
 * @returns {number|null}
 */
export const roundDecimal = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round((Number(num) + Number.EPSILON) * factor) / factor;
};

/**
 * Calculates numerical change and percentage change between latest and previous values
 * @param {number|null} latest
 * @param {number|null} previous
 * @returns {{ change: number|null, percentageChange: number|null }}
 */
export const calculateMetricChange = (latest, previous) => {
  if (
    latest === null ||
    latest === undefined ||
    isNaN(latest) ||
    previous === null ||
    previous === undefined ||
    isNaN(previous)
  ) {
    return { change: null, percentageChange: null };
  }

  const change = roundDecimal(Number(latest) - Number(previous), 2);
  let percentageChange = null;

  if (Number(previous) !== 0) {
    percentageChange = roundDecimal(
      ((Number(latest) - Number(previous)) / Number(previous)) * 100,
      2
    );
  }

  return { change, percentageChange };
};

/**
 * Resolve start and end dates based on period, with validation and user timezone awareness
 */
export const resolveDateRange = (
  period = '30d',
  customStart = null,
  customEnd = null,
  timezone = 'Asia/Kolkata'
) => {
  const normalizedPeriod = (period || '30d').toLowerCase();
  const { dateStr: todayStr } = getUserDateTime(timezone);

  let startDateStr = '';
  let endDateStr = '';

  if (normalizedPeriod === '7d') {
    startDateStr = addDaysToDate(todayStr, -6);
    endDateStr = todayStr;
  } else if (normalizedPeriod === '30d') {
    startDateStr = addDaysToDate(todayStr, -29);
    endDateStr = todayStr;
  } else if (normalizedPeriod === '90d') {
    startDateStr = addDaysToDate(todayStr, -89);
    endDateStr = todayStr;
  } else if (normalizedPeriod === 'custom') {
    if (!customStart || !customEnd) {
      throw new ApiError(400, "Both 'startDate' and 'endDate' are required when period is 'custom'");
    }
    if (!isValidDateString(customStart)) {
      throw new ApiError(400, `Invalid startDate '${customStart}'. Must be in YYYY-MM-DD format`);
    }
    if (!isValidDateString(customEnd)) {
      throw new ApiError(400, `Invalid endDate '${customEnd}'. Must be in YYYY-MM-DD format`);
    }
    if (customStart > customEnd) {
      throw new ApiError(400, `startDate (${customStart}) cannot be after endDate (${customEnd})`);
    }
    const rangeArray = getDateRangeArray(customStart, customEnd);
    if (rangeArray.length > 366) {
      throw new ApiError(
        400,
        `Date range (${rangeArray.length} days) exceeds maximum allowed limit of 366 days`
      );
    }
    startDateStr = customStart;
    endDateStr = customEnd;
  } else {
    throw new ApiError(
      400,
      `Invalid period '${period}'. Allowed periods: ${ALLOWED_PERIODS.join(', ')}`
    );
  }

  const startUtc =
    combineDateAndTimeToUTC(startDateStr, '00:00', timezone) ||
    new Date(`${startDateStr}T00:00:00.000Z`);
  const endOfDayMinutes =
    combineDateAndTimeToUTC(endDateStr, '23:59', timezone) ||
    new Date(`${endDateStr}T23:59:00.000Z`);
  const endUtc = new Date(endOfDayMinutes.getTime() + 59999);

  return {
    period: normalizedPeriod,
    startDate: startDateStr,
    endDate: endDateStr,
    startUtc,
    endUtc,
  };
};

/**
 * Extracts a chronological trend array for single-value metrics (weight, bloodSugar, heartRate, temperature)
 */
export const getMetricTrend = (records = [], metric, timezone = 'Asia/Kolkata') => {
  const trend = [];

  for (const record of records) {
    const val = record[metric];
    if (val !== undefined && val !== null && !isNaN(val)) {
      const recDate = new Date(record.recordDate);
      const userDt = getUserDateTime(timezone, recDate);
      trend.push({
        date: userDt.dateStr,
        time: userDt.timeStr,
        dateTime: recDate.toISOString(),
        value: roundDecimal(Number(val), 2),
      });
    }
  }

  return trend;
};

/**
 * Extracts a chronological trend array for Blood Pressure (systolic and diastolic)
 */
export const getBloodPressureTrend = (records = [], timezone = 'Asia/Kolkata') => {
  const trend = [];

  for (const record of records) {
    const bp = record.bloodPressure;
    if (
      bp &&
      bp.systolic !== undefined &&
      bp.systolic !== null &&
      bp.diastolic !== undefined &&
      bp.diastolic !== null &&
      !isNaN(bp.systolic) &&
      !isNaN(bp.diastolic)
    ) {
      const recDate = new Date(record.recordDate);
      const userDt = getUserDateTime(timezone, recDate);
      trend.push({
        date: userDt.dateStr,
        time: userDt.timeStr,
        dateTime: recDate.toISOString(),
        systolic: roundDecimal(Number(bp.systolic), 2),
        diastolic: roundDecimal(Number(bp.diastolic), 2),
      });
    }
  }

  return trend;
};

export const healthAnalyticsService = {
  /**
   * Retrieves health analytics trend data and calculations for specified metric and period
   */
  getHealthAnalytics: async (userId, query = {}) => {
    const metricLowerMap = {
      weight: 'weight',
      bloodpressure: 'bloodPressure',
      bloodsugar: 'bloodSugar',
      heartrate: 'heartRate',
      temperature: 'temperature',
      all: 'all',
    };
    const rawMetric = (query.metric || 'all').toLowerCase();
    const requestedMetric = metricLowerMap[rawMetric];
    if (!requestedMetric) {
      throw new ApiError(
        400,
        `Invalid metric '${query.metric}'. Allowed metrics: ${ALLOWED_METRICS.join(', ')}`
      );
    }

    const user = await User.findById(userId).select('timezone').lean();
    const timezone = user?.timezone || 'Asia/Kolkata';

    const range = resolveDateRange(query.period, query.startDate, query.endDate, timezone);

    // Query records strictly for the authenticated user within the resolved date range
    const records = await HealthRecord.find({
      user: userId,
      recordDate: { $gte: range.startUtc, $lte: range.endUtc },
    })
      .sort({ recordDate: 1, createdAt: 1 })
      .select('recordDate weight bloodPressure bloodSugar heartRate temperature notes createdAt')
      .lean();

    // Helper to compute a single metric package
    const buildSingleMetricData = async (metricKey) => {
      if (metricKey === 'bloodPressure') {
        const trend = getBloodPressureTrend(records, timezone);
        let latest = null;
        let previous = null;
        let change = null;

        if (trend.length >= 2) {
          const last = trend[trend.length - 1];
          const prev = trend[trend.length - 2];
          latest = { systolic: last.systolic, diastolic: last.diastolic };
          previous = { systolic: prev.systolic, diastolic: prev.diastolic };
        } else if (trend.length === 1) {
          const last = trend[0];
          latest = { systolic: last.systolic, diastolic: last.diastolic };
          // Look up prior reading before start date
          const prior = await HealthRecord.findOne({
            user: userId,
            recordDate: { $lt: range.startUtc },
            'bloodPressure.systolic': { $ne: null },
          })
            .sort({ recordDate: -1, createdAt: -1 })
            .select('bloodPressure')
            .lean();

          if (prior?.bloodPressure?.systolic && prior?.bloodPressure?.diastolic) {
            previous = {
              systolic: roundDecimal(prior.bloodPressure.systolic, 2),
              diastolic: roundDecimal(prior.bloodPressure.diastolic, 2),
            };
          }
        }

        if (latest && previous) {
          const sysChange = calculateMetricChange(latest.systolic, previous.systolic);
          const diaChange = calculateMetricChange(latest.diastolic, previous.diastolic);
          change = {
            systolic: sysChange.change,
            diastolic: diaChange.change,
          };
        } else if (latest) {
          change = { systolic: null, diastolic: null };
        }

        return {
          metric: 'bloodPressure',
          unit: METRIC_UNITS.bloodPressure,
          latest,
          previous,
          change,
          recordCount: trend.length,
          trend,
        };
      }

      // Single numeric metric
      const trend = getMetricTrend(records, metricKey, timezone);
      let latest = null;
      let previous = null;

      if (trend.length >= 2) {
        latest = trend[trend.length - 1].value;
        previous = trend[trend.length - 2].value;
      } else if (trend.length === 1) {
        latest = trend[0].value;
        const prior = await HealthRecord.findOne({
          user: userId,
          recordDate: { $lt: range.startUtc },
          [metricKey]: { $ne: null },
        })
          .sort({ recordDate: -1, createdAt: -1 })
          .select(metricKey)
          .lean();

        if (prior && prior[metricKey] !== undefined && prior[metricKey] !== null) {
          previous = roundDecimal(Number(prior[metricKey]), 2);
        }
      }

      const { change, percentageChange } = calculateMetricChange(latest, previous);

      return {
        metric: metricKey,
        unit: METRIC_UNITS[metricKey],
        latest,
        previous,
        change,
        percentageChange,
        recordCount: trend.length,
        trend,
      };
    };

    if (requestedMetric !== 'all') {
      const singleData = await buildSingleMetricData(requestedMetric);
      return {
        period: range.period,
        startDate: range.startDate,
        endDate: range.endDate,
        ...singleData,
      };
    }

    // Build all 5 metrics
    const [weightData, bpData, sugarData, hrData, tempData] = await Promise.all([
      buildSingleMetricData('weight'),
      buildSingleMetricData('bloodPressure'),
      buildSingleMetricData('bloodSugar'),
      buildSingleMetricData('heartRate'),
      buildSingleMetricData('temperature'),
    ]);

    return {
      period: range.period,
      startDate: range.startDate,
      endDate: range.endDate,
      metrics: {
        weight: weightData,
        bloodPressure: bpData,
        bloodSugar: sugarData,
        heartRate: hrData,
        temperature: tempData,
      },
      summary: {
        weight: {
          latest: weightData.latest,
          previous: weightData.previous,
          change: weightData.change,
          percentageChange: weightData.percentageChange,
          unit: weightData.unit,
          recordCount: weightData.recordCount,
        },
        bloodPressure: {
          latest: bpData.latest,
          previous: bpData.previous,
          change: bpData.change,
          unit: bpData.unit,
          recordCount: bpData.recordCount,
        },
        bloodSugar: {
          latest: sugarData.latest,
          previous: sugarData.previous,
          change: sugarData.change,
          percentageChange: sugarData.percentageChange,
          unit: sugarData.unit,
          recordCount: sugarData.recordCount,
        },
        heartRate: {
          latest: hrData.latest,
          previous: hrData.previous,
          change: hrData.change,
          percentageChange: hrData.percentageChange,
          unit: hrData.unit,
          recordCount: hrData.recordCount,
        },
        temperature: {
          latest: tempData.latest,
          previous: tempData.previous,
          change: tempData.change,
          percentageChange: tempData.percentageChange,
          unit: tempData.unit,
          recordCount: tempData.recordCount,
        },
      },
    };
  },

  /**
   * Retrieves concise health KPI summary across all 5 vital metrics
   */
  getHealthSummary: async (userId, query = {}) => {
    const analytics = await healthAnalyticsService.getHealthAnalytics(userId, {
      ...query,
      metric: 'all',
    });

    return {
      period: analytics.period,
      startDate: analytics.startDate,
      endDate: analytics.endDate,
      metrics: analytics.summary,
    };
  },
};

export default healthAnalyticsService;
