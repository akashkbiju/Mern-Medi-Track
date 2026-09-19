import { healthAnalyticsService, METRIC_UNITS } from './healthAnalyticsService.js';
import { adherenceService } from './adherenceService.js';
import { env } from '../config/env.js';

export const INSIGHT_CATEGORIES = {
  WEIGHT: 'weight',
  BLOOD_PRESSURE: 'blood_pressure',
  BLOOD_SUGAR: 'blood_sugar',
  HEART_RATE: 'heart_rate',
  TEMPERATURE: 'temperature',
  CONSISTENCY: 'consistency',
  ADHERENCE: 'adherence',
  GENERAL: 'general',
};

export const INSIGHT_TYPES = {
  TREND: 'trend',
  CHANGE: 'change',
  CONSISTENCY: 'consistency',
  MISSING_DATA: 'missing_data',
  ADHERENCE: 'adherence',
  SUMMARY: 'summary',
};

export const INSIGHT_SEVERITIES = {
  INFO: 'info',
  ATTENTION: 'attention',
  POSITIVE: 'positive',
};

/**
 * Generate generic metric insights for single-number parameters (weight, bloodSugar, heartRate, temperature)
 */
export const generateSingleMetricInsights = ({
  data = {},
  metricKey,
  category,
  displayName,
  unit,
  thresholdPercent = 10,
}) => {
  const insights = [];
  const trend = data.trend || [];
  const recordCount = data.recordCount || trend.length;

  if (recordCount === 0) {
    insights.push({
      id: `${category}-missing`,
      category,
      type: INSIGHT_TYPES.MISSING_DATA,
      severity: INSIGHT_SEVERITIES.INFO,
      title: `No ${displayName} records`,
      message: `No ${displayName.toLowerCase()} measurements were recorded during the selected period.`,
      metric: metricKey,
      unit,
      createdAt: new Date().toISOString(),
    });
    return insights;
  }

  if (recordCount === 1) {
    insights.push({
      id: `${category}-single`,
      category,
      type: INSIGHT_TYPES.CONSISTENCY,
      severity: INSIGHT_SEVERITIES.INFO,
      title: `Single ${displayName} record`,
      message: `Only one ${displayName.toLowerCase()} measurement was recorded in this period, so a trend cannot be calculated yet.`,
      metric: metricKey,
      value: trend[0].value,
      unit,
      createdAt: new Date().toISOString(),
    });
    return insights;
  }

  // 2+ records: evaluate change vs previous
  if (data.change !== null && data.change !== undefined) {
    const absPct = Math.abs(data.percentageChange || 0);
    const isNotable = absPct >= thresholdPercent;
    const sign = data.change > 0 ? `+${data.change}` : `${data.change}`;
    const pctStr =
      data.percentageChange !== null && data.percentageChange !== undefined
        ? ` (${data.percentageChange > 0 ? `+${data.percentageChange}` : data.percentageChange}%)`
        : '';

    const message = isNotable
      ? `Your recorded ${displayName.toLowerCase()} has changed noticeably by ${sign} ${unit}${pctStr} compared with your previous record.`
      : `Your recorded ${displayName.toLowerCase()} has changed by ${sign} ${unit} compared with the previous available measurement.`;

    insights.push({
      id: `${category}-change`,
      category,
      type: INSIGHT_TYPES.CHANGE,
      severity: isNotable ? INSIGHT_SEVERITIES.ATTENTION : INSIGHT_SEVERITIES.INFO,
      title: `${displayName} change`,
      message,
      metric: metricKey,
      value: data.change,
      unit,
      createdAt: new Date().toISOString(),
    });
  }

  // 3+ records: evaluate trend direction
  if (trend.length >= 3) {
    const firstVal = trend[0].value;
    const lastVal = trend[trend.length - 1].value;
    const diff = lastVal - firstVal;
    const pctShift = firstVal !== 0 ? (diff / firstVal) * 100 : 0;

    let trendMsg = '';
    let trendSeverity = INSIGHT_SEVERITIES.INFO;

    if (pctShift > 3) {
      trendMsg = `Your recorded ${displayName.toLowerCase()} has shown a gradual upward trend over the selected period.`;
    } else if (pctShift < -3) {
      trendMsg = `Your recorded ${displayName.toLowerCase()} has shown a gradual downward trend over the selected period.`;
    } else {
      trendMsg = `Your recorded ${displayName.toLowerCase()} has remained relatively stable across the selected period.`;
      trendSeverity = INSIGHT_SEVERITIES.POSITIVE;
    }

    insights.push({
      id: `${category}-trend`,
      category,
      type: INSIGHT_TYPES.TREND,
      severity: trendSeverity,
      title: `${displayName} trend`,
      message: trendMsg,
      metric: metricKey,
      unit,
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
};

export const healthInsightService = {
  /**
   * Generate weight insights
   */
  generateWeightInsights: (weightData = {}, thresholdPercent = 10) => {
    return generateSingleMetricInsights({
      data: weightData,
      metricKey: 'weight',
      category: INSIGHT_CATEGORIES.WEIGHT,
      displayName: 'Weight',
      unit: METRIC_UNITS.weight,
      thresholdPercent,
    });
  },

  /**
   * Generate blood pressure insights (systolic & diastolic)
   */
  generateBloodPressureInsights: (bpData = {}, thresholdPercent = 10) => {
    const insights = [];
    const trend = bpData.trend || [];
    const recordCount = bpData.recordCount || trend.length;

    if (recordCount === 0) {
      insights.push({
        id: 'blood_pressure-missing',
        category: INSIGHT_CATEGORIES.BLOOD_PRESSURE,
        type: INSIGHT_TYPES.MISSING_DATA,
        severity: INSIGHT_SEVERITIES.INFO,
        title: 'No Blood Pressure records',
        message: 'No blood pressure measurements were recorded during the selected period.',
        metric: 'bloodPressure',
        unit: METRIC_UNITS.bloodPressure,
        createdAt: new Date().toISOString(),
      });
      return insights;
    }

    if (recordCount === 1) {
      insights.push({
        id: 'blood_pressure-single',
        category: INSIGHT_CATEGORIES.BLOOD_PRESSURE,
        type: INSIGHT_TYPES.CONSISTENCY,
        severity: INSIGHT_SEVERITIES.INFO,
        title: 'Single Blood Pressure record',
        message: `Only one blood pressure measurement was recorded in this period (${trend[0].systolic}/${trend[0].diastolic} mmHg), so a trend cannot be calculated yet.`,
        metric: 'bloodPressure',
        unit: METRIC_UNITS.bloodPressure,
        createdAt: new Date().toISOString(),
      });
      return insights;
    }

    // Change analysis
    if (bpData.change && bpData.change.systolic !== null && bpData.change.systolic !== undefined) {
      const sysChange = bpData.change.systolic;
      const diaChange = bpData.change.diastolic;
      const sysSign = sysChange > 0 ? `+${sysChange}` : `${sysChange}`;
      const diaSign = diaChange > 0 ? `+${diaChange}` : `${diaChange}`;

      const isNotable = Math.abs(sysChange) >= 15 || Math.abs(diaChange) >= 10;

      const message = isNotable
        ? `Your recorded blood pressure has changed noticeably by ${sysSign} mmHg systolic and ${diaSign} mmHg diastolic compared with your previous record.`
        : `Your recorded systolic measurement changed by ${sysSign} mmHg and diastolic changed by ${diaSign} mmHg compared with the previous available measurement.`;

      insights.push({
        id: 'blood_pressure-change',
        category: INSIGHT_CATEGORIES.BLOOD_PRESSURE,
        type: INSIGHT_TYPES.CHANGE,
        severity: isNotable ? INSIGHT_SEVERITIES.ATTENTION : INSIGHT_SEVERITIES.INFO,
        title: 'Blood Pressure change',
        message,
        metric: 'bloodPressure',
        value: sysChange,
        unit: METRIC_UNITS.bloodPressure,
        createdAt: new Date().toISOString(),
      });
    }

    // Trend analysis (3+ records)
    if (trend.length >= 3) {
      const firstSys = trend[0].systolic;
      const lastSys = trend[trend.length - 1].systolic;
      const sysDiff = lastSys - firstSys;

      let bpMsg = '';
      let bpSeverity = INSIGHT_SEVERITIES.INFO;

      if (sysDiff >= 6) {
        bpMsg = 'Your recorded systolic measurements have generally increased during this period.';
      } else if (sysDiff <= -6) {
        bpMsg = 'Your recorded systolic measurements have generally decreased during this period.';
      } else {
        bpMsg = 'Your recorded blood pressure has remained relatively stable across the selected period.';
        bpSeverity = INSIGHT_SEVERITIES.POSITIVE;
      }

      insights.push({
        id: 'blood_pressure-trend',
        category: INSIGHT_CATEGORIES.BLOOD_PRESSURE,
        type: INSIGHT_TYPES.TREND,
        severity: bpSeverity,
        title: 'Blood Pressure trend',
        message: bpMsg,
        metric: 'bloodPressure',
        unit: METRIC_UNITS.bloodPressure,
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  },

  /**
   * Generate blood sugar insights
   */
  generateBloodSugarInsights: (sugarData = {}, thresholdPercent = 10) => {
    return generateSingleMetricInsights({
      data: sugarData,
      metricKey: 'bloodSugar',
      category: INSIGHT_CATEGORIES.BLOOD_SUGAR,
      displayName: 'Blood Sugar',
      unit: METRIC_UNITS.bloodSugar,
      thresholdPercent,
    });
  },

  /**
   * Generate heart rate insights
   */
  generateHeartRateInsights: (hrData = {}, thresholdPercent = 10) => {
    return generateSingleMetricInsights({
      data: hrData,
      metricKey: 'heartRate',
      category: INSIGHT_CATEGORIES.HEART_RATE,
      displayName: 'Heart Rate',
      unit: METRIC_UNITS.heartRate,
      thresholdPercent,
    });
  },

  /**
   * Generate temperature insights
   */
  generateTemperatureInsights: (tempData = {}, thresholdPercent = 10) => {
    return generateSingleMetricInsights({
      data: tempData,
      metricKey: 'temperature',
      category: INSIGHT_CATEGORIES.TEMPERATURE,
      displayName: 'Temperature',
      unit: METRIC_UNITS.temperature,
      thresholdPercent: 2, // Temperature variation is smaller in percentage
    });
  },

  /**
   * Generate measurement consistency insights
   */
  generateMeasurementConsistencyInsights: (analyticsData = {}) => {
    const insights = [];
    const metrics = analyticsData.metrics || {};
    let totalCount = 0;

    for (const key of Object.keys(metrics)) {
      totalCount += metrics[key]?.recordCount || 0;
    }

    if (totalCount === 0) {
      insights.push({
        id: 'consistency-no-data',
        category: INSIGHT_CATEGORIES.CONSISTENCY,
        type: INSIGHT_TYPES.CONSISTENCY,
        severity: INSIGHT_SEVERITIES.INFO,
        title: 'No Data Recorded',
        message:
          'No health measurements were recorded in the selected period. Add records in Health Tracking to establish a personal baseline.',
        createdAt: new Date().toISOString(),
      });
    } else if (totalCount <= 3) {
      insights.push({
        id: 'consistency-limited-data',
        category: INSIGHT_CATEGORIES.CONSISTENCY,
        type: INSIGHT_TYPES.CONSISTENCY,
        severity: INSIGHT_SEVERITIES.INFO,
        title: 'Data Consistency',
        message:
          'More recorded measurements over time can make personal trends easier to visualize.',
        createdAt: new Date().toISOString(),
      });
    } else {
      insights.push({
        id: 'consistency-active',
        category: INSIGHT_CATEGORIES.CONSISTENCY,
        type: INSIGHT_TYPES.CONSISTENCY,
        severity: INSIGHT_SEVERITIES.POSITIVE,
        title: 'Consistent Tracking',
        message:
          'Measurements were recorded consistently during this period, establishing a reliable personal baseline.',
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  },

  /**
   * Generate concise overall summary statement
   */
  generateOverallInsights: (analyticsData = {}, adherenceData = null) => {
    const metrics = analyticsData.metrics || {};
    let totalRecords = 0;
    const metricsWithTrend = [];
    const metricsLimited = [];

    const labelMap = {
      weight: 'weight',
      bloodPressure: 'blood pressure',
      bloodSugar: 'blood sugar',
      heartRate: 'heart rate',
      temperature: 'temperature',
    };

    for (const [key, val] of Object.entries(metrics)) {
      const count = val?.recordCount || 0;
      totalRecords += count;
      if (count >= 3) {
        metricsWithTrend.push(labelMap[key] || key);
      } else if (count > 0) {
        metricsLimited.push(labelMap[key] || key);
      }
    }

    if (totalRecords === 0) {
      return 'No health records were logged in the selected period.';
    }

    let summary = `Your health records contain ${totalRecords} measurements across the selected period.`;
    if (metricsWithTrend.length > 0) {
      summary += ` ${metricsWithTrend.join(' and ')} have enough data to show recent trends.`;
    }
    if (metricsLimited.length > 0) {
      summary += ` ${metricsLimited.join(' and ')} have limited measurements.`;
    }

    if (adherenceData?.hasData) {
      summary += ` Medication adherence for this period is ${adherenceData.adherenceScore}%.`;
    }

    return summary;
  },

  /**
   * Main orchestrator: Generate complete, structured insights package for authenticated user
   */
  generateHealthInsights: async (userId, query = {}) => {
    const thresholdPercent = env.HEALTH_INSIGHT_CHANGE_THRESHOLD_PERCENT || 10;

    // 1. Fetch complete health analytics across all 5 vital parameters
    const analytics = await healthAnalyticsService.getHealthAnalytics(userId, {
      ...query,
      metric: 'all',
    });

    // 2. Fetch medication adherence context for the same period
    let adherence = null;
    try {
      adherence = await adherenceService.getAdherenceSummary(userId, {
        period: query.period || '30d',
        startDate: query.startDate,
        endDate: query.endDate,
      });
    } catch {
      adherence = null;
    }

    const metrics = analytics.metrics || {};
    const insights = [];

    // 3. Generate insights for each vital parameter
    insights.push(
      ...healthInsightService.generateWeightInsights(metrics.weight, thresholdPercent)
    );
    insights.push(
      ...healthInsightService.generateBloodPressureInsights(
        metrics.bloodPressure,
        thresholdPercent
      )
    );
    insights.push(
      ...healthInsightService.generateBloodSugarInsights(
        metrics.bloodSugar,
        thresholdPercent
      )
    );
    insights.push(
      ...healthInsightService.generateHeartRateInsights(
        metrics.heartRate,
        thresholdPercent
      )
    );
    insights.push(
      ...healthInsightService.generateTemperatureInsights(
        metrics.temperature,
        thresholdPercent
      )
    );

    // 4. Generate data consistency insight
    insights.push(
      ...healthInsightService.generateMeasurementConsistencyInsights(analytics)
    );

    // 5. Generate medication adherence context insight if available
    if (adherence && adherence.hasData) {
      insights.push({
        id: 'adherence-context',
        category: INSIGHT_CATEGORIES.ADHERENCE,
        type: INSIGHT_TYPES.ADHERENCE,
        severity:
          adherence.adherenceScore >= 80
            ? INSIGHT_SEVERITIES.POSITIVE
            : INSIGHT_SEVERITIES.INFO,
        title: 'Medication Adherence Context',
        message: `Medication adherence for the selected period is ${adherence.adherenceScore}%. (${adherence.taken} of ${adherence.totalEligible} scheduled doses recorded as taken).`,
        value: adherence.adherenceScore,
        unit: '%',
        createdAt: new Date().toISOString(),
      });
    }

    // 6. Generate overall summary
    const summary = healthInsightService.generateOverallInsights(analytics, adherence);

    return {
      period: analytics.period,
      startDate: analytics.startDate,
      endDate: analytics.endDate,
      generatedAt: new Date().toISOString(),
      summary,
      insights,
    };
  },
};

export default healthInsightService;
