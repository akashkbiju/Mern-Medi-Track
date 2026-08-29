import HealthRecord from '../models/HealthRecord.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import {
  formatDate,
  isValidDateString,
  getUserDateTime,
  addDaysToDate,
  getDateRangeArray,
  formatTime12h,
} from '../utils/dateTime.js';

export const HEALTH_METRICS = {
  WEIGHT: 'weight',
  BLOOD_PRESSURE: 'bloodPressure',
  BLOOD_SUGAR: 'bloodSugar',
  HEART_RATE: 'heartRate',
  TEMPERATURE: 'temperature',
  ALL: 'all',
};

export const METRIC_UNITS = {
  weight: 'kg',
  bloodPressure: 'mmHg',
  bloodSugar: 'mg/dL',
  heartRate: 'BPM',
  temperature: '°C',
};

export const HEALTH_ANALYTICS_DISCLAIMER =
  'Health analytics summarizes user-recorded measurements over time. It is not a medical diagnosis or treatment recommendation.';

/**
 * Rounds a number to a fixed decimal precision
 * @param {number|null} num
 * @param {number} [decimals=2]
 * @returns {number|null}
 */
export const roundDecimal = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

/**
 * Calculate numerical change and percentage change between latest and previous values.
 * Only computes percentage change when previous is not zero.
 *
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

  const change = roundDecimal(latest - previous, 2);
  let percentageChange = null;

  if (previous !== 0) {
    percentageChange = roundDecimal(((latest - previous) / Math.abs(previous)) * 100, 2);
  }

  return { change, percentageChange };
};

/**
 * Resolve calendar dates window for the requested period
 *
 * @param {string} rawPeriod - '7d', '30d', '90d', 'custom'
 * @param {string} [startDate] - YYYY-MM-DD for custom
 * @param {string} [endDate] - YYYY-MM-DD for custom
 * @param {string} todayDateStr - Current local date YYYY-MM-DD
 * @returns {{ period: string, startDateStr: string, endDateStr: string }}
 */
export const resolveDateRange = (rawPeriod, startDate, endDate, todayDateStr) => {
  const period = (rawPeriod || '30d').toLowerCase();
  let startDateStr;
  let endDateStr;

  if (period === '7d') {
    startDateStr = addDaysToDate(todayDateStr, -6);
    endDateStr = todayDateStr;
  } else if (period === '30d') {
    startDateStr = addDaysToDate(todayDateStr, -29);
    endDateStr = todayDateStr;
  } else if (period === '90d') {
    startDateStr = addDaysToDate(todayDateStr, -89);
    endDateStr = todayDateStr;
  } else if (period === 'custom') {
    startDateStr = startDate;
    endDateStr = endDate;

    if (!isValidDateString(startDateStr) || !isValidDateString(endDateStr)) {
      throw new ApiError(400, "Custom period requires valid 'startDate' and 'endDate' in YYYY-MM-DD format");
    }

    if (startDateStr > endDateStr) {
      throw new ApiError(400, `startDate (${startDateStr}) cannot be after endDate (${endDateStr})`);
    }

    const rangeDays = getDateRangeArray(startDateStr, endDateStr);
    if (rangeDays.length > 366) {
      throw new ApiError(400, `Date range (${rangeDays.length} days) exceeds maximum allowed limit of 366 days (1 year)`);
    }
  } else {
    throw new ApiError(400, "Invalid period. Allowed values: '7d', '30d', '90d', 'custom'");
  }

  return { period, startDateStr, endDateStr };
};

/**
 * Extract chronological trend and statistics for a single numeric metric (weight, bloodSugar, heartRate, temperature)
 *
 * @param {Array<Object>} records - Raw HealthRecord plain objects sorted ascending by recordDate
 * @param {string} metric - 'weight' | 'bloodSugar' | 'heartRate' | 'temperature'
 * @param {string} timezone - User's IANA timezone
 * @returns {Object} Metric analytics summary & trend
 */
export const processNumericMetric = (records, metric, timezone) => {
  const unit = METRIC_UNITS[metric] || '';

  // Filter records that contain a valid measurement for this metric (never treat missing as zero)
  const matching = records.filter(
    (r) => r[metric] !== undefined && r[metric] !== null && !isNaN(r[metric])
  );

  const trend = matching.map((r) => {
    const d = new Date(r.recordDate);
    const userDT = getUserDateTime(timezone, d);
    return {
      id: r._id,
      date: formatDate(r.recordDate),
      time: formatTime12h(userDT.timeStr),
      timestamp: r.recordDate,
      value: roundDecimal(Number(r[metric]), 2),
      notes: r.notes || '',
    };
  });

  const recordCount = matching.length;

  if (recordCount === 0) {
    return {
      metric,
      unit,
      latest: null,
      previous: null,
      change: null,
      percentageChange: null,
      recordCount: 0,
      trend: [],
    };
  }

  if (recordCount === 1) {
    const latestVal = roundDecimal(Number(matching[0][metric]), 2);
    return {
      metric,
      unit,
      latest: latestVal,
      previous: null,
      change: null,
      percentageChange: null,
      recordCount: 1,
      trend,
    };
  }

  const latestVal = roundDecimal(Number(matching[recordCount - 1][metric]), 2);
  const previousVal = roundDecimal(Number(matching[recordCount - 2][metric]), 2);
  const { change, percentageChange } = calculateMetricChange(latestVal, previousVal);

  return {
    metric,
    unit,
    latest: latestVal,
    previous: previousVal,
    change,
    percentageChange,
    recordCount,
    trend,
  };
};

/**
 * Extract chronological trend and statistics for Blood Pressure (systolic & diastolic)
 *
 * @param {Array<Object>} records - Raw HealthRecord plain objects sorted ascending by recordDate
 * @param {string} timezone - User's IANA timezone
 * @returns {Object} Blood pressure analytics summary & dual-line trend
 */
export const processBloodPressureMetric = (records, timezone) => {
  const unit = METRIC_UNITS.bloodPressure;

  const matching = records.filter(
    (r) =>
      r.bloodPressure &&
      r.bloodPressure.systolic !== undefined &&
      r.bloodPressure.systolic !== null &&
      !isNaN(r.bloodPressure.systolic) &&
      r.bloodPressure.diastolic !== undefined &&
      r.bloodPressure.diastolic !== null &&
      !isNaN(r.bloodPressure.diastolic)
  );

  const trend = matching.map((r) => {
    const d = new Date(r.recordDate);
    const userDT = getUserDateTime(timezone, d);
    return {
      id: r._id,
      date: formatDate(r.recordDate),
      time: formatTime12h(userDT.timeStr),
      timestamp: r.recordDate,
      systolic: roundDecimal(Number(r.bloodPressure.systolic), 0),
      diastolic: roundDecimal(Number(r.bloodPressure.diastolic), 0),
      notes: r.notes || '',
    };
  });

  const recordCount = matching.length;

  if (recordCount === 0) {
    return {
      metric: 'bloodPressure',
      unit,
      latest: null,
      previous: null,
      change: null,
      recordCount: 0,
      trend: [],
    };
  }

  if (recordCount === 1) {
    const latestSys = roundDecimal(Number(matching[0].bloodPressure.systolic), 0);
    const latestDia = roundDecimal(Number(matching[0].bloodPressure.diastolic), 0);
    return {
      metric: 'bloodPressure',
      unit,
      latest: {
        systolic: latestSys,
        diastolic: latestDia,
      },
      previous: null,
      change: null,
      recordCount: 1,
      trend,
    };
  }

  const last = matching[recordCount - 1];
  const prev = matching[recordCount - 2];

  const latestSys = roundDecimal(Number(last.bloodPressure.systolic), 0);
  const latestDia = roundDecimal(Number(last.bloodPressure.diastolic), 0);
  const prevSys = roundDecimal(Number(prev.bloodPressure.systolic), 0);
  const prevDia = roundDecimal(Number(prev.bloodPressure.diastolic), 0);

  const systolicChange = roundDecimal(latestSys - prevSys, 0);
  const diastolicChange = roundDecimal(latestDia - prevDia, 0);

  return {
    metric: 'bloodPressure',
    unit,
    latest: {
      systolic: latestSys,
      diastolic: latestDia,
    },
    previous: {
      systolic: prevSys,
      diastolic: prevDia,
    },
    change: {
      systolic: systolicChange,
      diastolic: diastolicChange,
    },
    recordCount,
    trend,
  };
};

/**
 * Health Analytics Service Interface
 */
export const healthAnalyticsService = {
  /**
   * Retrieve health analytics trends & statistics for an authenticated user
   *
   * @param {string} userId - User ID (strictly req.user.id)
   * @param {Object} query - { metric, period, startDate, endDate }
   * @returns {Promise<Object>}
   */
  getHealthAnalytics: async (userId, query = {}) => {
    // 1. Resolve user timezone
    const user = await User.findById(userId).select('timezone');
    const timezone = user?.timezone || 'Asia/Kolkata';

    const { dateStr: todayDateStr } = getUserDateTime(timezone);

    // 2. Resolve date range
    const { period, startDateStr, endDateStr } = resolveDateRange(
      query.period,
      query.startDate,
      query.endDate,
      todayDateStr
    );

    // 3. Resolve metric
    const requestedMetric = (query.metric || 'all').toLowerCase();
    const validMetrics = ['weight', 'bloodpressure', 'bloodsugar', 'heartrate', 'temperature', 'all'];
    if (!validMetrics.includes(requestedMetric)) {
      throw new ApiError(
        400,
        `Invalid metric '${query.metric}'. Allowed values: weight, bloodPressure, bloodSugar, heartRate, temperature, all`
      );
    }

    // 4. Query HealthRecord within time window (UTC converted)
    const startUTC = new Date(`${startDateStr}T00:00:00.000Z`);
    const endUTC = new Date(`${endDateStr}T23:59:59.999Z`);

    const records = await HealthRecord.find({
      user: userId,
      recordDate: { $gte: startUTC, $lte: endUTC },
    })
      .sort({ recordDate: 1 })
      .select('recordDate weight bloodPressure bloodSugar heartRate temperature notes')
      .lean();

    // 5. Build analytics response based on requested metric
    if (requestedMetric === 'all') {
      const weightData = processNumericMetric(records, 'weight', timezone);
      const bpData = processBloodPressureMetric(records, timezone);
      const bloodSugarData = processNumericMetric(records, 'bloodSugar', timezone);
      const heartRateData = processNumericMetric(records, 'heartRate', timezone);
      const temperatureData = processNumericMetric(records, 'temperature', timezone);

      return {
        period,
        startDate: startDateStr,
        endDate: endDateStr,
        timezone,
        totalRecords: records.length,
        disclaimer: HEALTH_ANALYTICS_DISCLAIMER,
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
            latest: bloodSugarData.latest,
            previous: bloodSugarData.previous,
            change: bloodSugarData.change,
            percentageChange: bloodSugarData.percentageChange,
            unit: bloodSugarData.unit,
            recordCount: bloodSugarData.recordCount,
          },
          heartRate: {
            latest: heartRateData.latest,
            previous: heartRateData.previous,
            change: heartRateData.change,
            percentageChange: heartRateData.percentageChange,
            unit: heartRateData.unit,
            recordCount: heartRateData.recordCount,
          },
          temperature: {
            latest: temperatureData.latest,
            previous: temperatureData.previous,
            change: temperatureData.change,
            percentageChange: temperatureData.percentageChange,
            unit: temperatureData.unit,
            recordCount: temperatureData.recordCount,
          },
        },
        metrics: {
          weight: weightData,
          bloodPressure: bpData,
          bloodSugar: bloodSugarData,
          heartRate: heartRateData,
          temperature: temperatureData,
        },
      };
    }

    // Specific single metric requested
    let metricResult;
    if (requestedMetric === 'bloodpressure') {
      metricResult = processBloodPressureMetric(records, timezone);
    } else {
      const normalizedKey =
        requestedMetric === 'bloodsugar'
          ? 'bloodSugar'
          : requestedMetric === 'heartrate'
          ? 'heartRate'
          : requestedMetric;
      metricResult = processNumericMetric(records, normalizedKey, timezone);
    }

    return {
      period,
      startDate: startDateStr,
      endDate: endDateStr,
      timezone,
      disclaimer: HEALTH_ANALYTICS_DISCLAIMER,
      ...metricResult,
    };
  },

  /**
   * Retrieve compact health summary cards for all metrics
   *
   * @param {string} userId - User ID (req.user.id)
   * @param {Object} query - { period, startDate, endDate }
   * @returns {Promise<Object>}
   */
  getHealthSummary: async (userId, query = {}) => {
    const full = await healthAnalyticsService.getHealthAnalytics(userId, {
      ...query,
      metric: 'all',
    });

    return {
      period: full.period,
      startDate: full.startDate,
      endDate: full.endDate,
      timezone: full.timezone,
      disclaimer: full.disclaimer,
      metrics: full.summary,
    };
  },
};

export default healthAnalyticsService;
