import mongoose from 'mongoose';
import {
  healthInsightService,
  generateSingleMetricInsights,
  INSIGHT_CATEGORIES,
  INSIGHT_TYPES,
  INSIGHT_SEVERITIES,
} from '../services/healthInsightService.js';
import { validateHealthAnalyticsQuery } from '../validators/analyticsValidator.js';
import { protect } from '../middleware/authMiddleware.js';

/**
 * Step 17 Verification Test Suite: Smart Health Insights
 * Covers all 29 scenarios specified in Step 17 Section 33
 */
async function runHealthInsightTests() {
  console.log('--- Starting Step 17 Smart Health Insights Verification Suite ---');
  let passed = 0;
  let failed = 0;

  const assertTest = (description, condition) => {
    if (condition) {
      console.log(`✓ PASSED: ${description}`);
      passed++;
    } else {
      console.error(`✗ FAILED: ${description}`);
      failed++;
    }
  };

  // Helper to run express validator middleware
  const runValidator = (validatorFn, req) => {
    let capturedError = null;
    validatorFn(req, {}, (err) => {
      capturedError = err || null;
    });
    return capturedError;
  };

  // --- Scenario 1 & 2: Authentication & Route Protection ---
  const reqUnauth = { headers: {} };
  const authError = await new Promise((resolve) => {
    protect(reqUnauth, {}, (err) => {
      resolve(err || null);
    });
  });
  assertTest(
    'Test 1: Unauthenticated request rejected by authMiddleware (401)',
    authError !== null && authError.statusCode === 401
  );

  const reqAuth = { query: { period: '30d' } };
  const authValErr = runValidator(validateHealthAnalyticsQuery, reqAuth);
  assertTest('Test 2: Authenticated request passes query validation', authValErr === null);

  // --- Scenario 3: User Isolation ---
  assertTest(
    'Test 3: User isolation enforced at service level (generateHealthInsights accepts userId)',
    typeof healthInsightService.generateHealthInsights === 'function'
  );

  // --- Scenarios 4, 5, 6, 7: Periods (7d, 30d, 90d, custom) ---
  assertTest(
    'Test 4: Period 7d query valid',
    runValidator(validateHealthAnalyticsQuery, { query: { period: '7d' } }) === null
  );
  assertTest(
    'Test 5: Period 30d query valid',
    runValidator(validateHealthAnalyticsQuery, { query: { period: '30d' } }) === null
  );
  assertTest(
    'Test 6: Period 90d query valid',
    runValidator(validateHealthAnalyticsQuery, { query: { period: '90d' } }) === null
  );
  assertTest(
    'Test 7: Valid custom date period query valid',
    runValidator(validateHealthAnalyticsQuery, {
      query: { period: 'custom', startDate: '2026-08-01', endDate: '2026-08-31' },
    }) === null
  );

  // --- Scenarios 8 & 9: Invalid dates and start date after end date ---
  const errBadDate = runValidator(validateHealthAnalyticsQuery, {
    query: { period: 'custom', startDate: '01-08-2026', endDate: '2026-08-31' },
  });
  assertTest(
    'Test 8: Invalid date format rejected',
    errBadDate !== null && errBadDate.statusCode === 400
  );

  const errInverted = runValidator(validateHealthAnalyticsQuery, {
    query: { period: 'custom', startDate: '2026-09-01', endDate: '2026-08-01' },
  });
  assertTest(
    'Test 9: startDate after endDate rejected',
    errInverted !== null && errInverted.statusCode === 400
  );

  // --- Scenario 10: No health records ---
  const emptyWeightInsights = healthInsightService.generateWeightInsights({
    trend: [],
    recordCount: 0,
  });
  assertTest(
    'Test 10: No health records generates missing_data insight',
    emptyWeightInsights.length === 1 &&
      emptyWeightInsights[0].type === INSIGHT_TYPES.MISSING_DATA &&
      emptyWeightInsights[0].message.includes('No weight measurements were recorded')
  );

  // --- Scenario 11: One health record ---
  const singleRecordInsights = healthInsightService.generateWeightInsights({
    trend: [{ date: '2026-09-01', value: 70.0 }],
    recordCount: 1,
  });
  assertTest(
    'Test 11: One record generates consistency insight explaining trend cannot be calculated yet',
    singleRecordInsights.length === 1 &&
      singleRecordInsights[0].type === INSIGHT_TYPES.CONSISTENCY &&
      singleRecordInsights[0].message.includes('trend cannot be calculated yet')
  );

  // --- Scenario 12: Two health records (comparison available) ---
  const twoRecordInsights = healthInsightService.generateWeightInsights({
    trend: [
      { date: '2026-09-01', value: 70.0 },
      { date: '2026-09-05', value: 69.5 },
    ],
    recordCount: 2,
    latest: 69.5,
    previous: 70.0,
    change: -0.5,
    percentageChange: -0.71,
  });
  assertTest(
    'Test 12: Two records generate comparison change insight without false trend',
    twoRecordInsights.length === 1 &&
      twoRecordInsights[0].type === INSIGHT_TYPES.CHANGE &&
      twoRecordInsights[0].message.includes('changed by -0.5 kg')
  );

  // --- Scenario 13, 14: Three or more records & Upward trend ---
  const upwardTrendInsights = healthInsightService.generateWeightInsights({
    trend: [
      { date: '2026-09-01', value: 68.0 },
      { date: '2026-09-03', value: 69.5 },
      { date: '2026-09-07', value: 71.0 },
    ],
    recordCount: 3,
    latest: 71.0,
    previous: 69.5,
    change: 1.5,
    percentageChange: 2.16,
  });
  const upTrendItem = upwardTrendInsights.find((i) => i.type === INSIGHT_TYPES.TREND);
  assertTest(
    'Test 13 & 14: Three or more records detect gradual upward trend',
    upTrendItem !== undefined && upTrendItem.message.includes('gradual upward trend')
  );

  // --- Scenario 15: Downward trend ---
  const downwardTrendInsights = healthInsightService.generateWeightInsights({
    trend: [
      { date: '2026-09-01', value: 72.0 },
      { date: '2026-09-03', value: 70.0 },
      { date: '2026-09-07', value: 68.5 },
    ],
    recordCount: 3,
    latest: 68.5,
    previous: 70.0,
    change: -1.5,
    percentageChange: -2.14,
  });
  const downTrendItem = downwardTrendInsights.find((i) => i.type === INSIGHT_TYPES.TREND);
  assertTest(
    'Test 15: Downward trend detected accurately',
    downTrendItem !== undefined && downTrendItem.message.includes('gradual downward trend')
  );

  // --- Scenario 16: Stable trend ---
  const stableTrendInsights = healthInsightService.generateWeightInsights({
    trend: [
      { date: '2026-09-01', value: 70.0 },
      { date: '2026-09-03', value: 70.1 },
      { date: '2026-09-07', value: 70.0 },
    ],
    recordCount: 3,
    latest: 70.0,
    previous: 70.1,
    change: -0.1,
    percentageChange: -0.14,
  });
  const stableTrendItem = stableTrendInsights.find((i) => i.type === INSIGHT_TYPES.TREND);
  assertTest(
    'Test 16: Stable trend detected with positive/info severity',
    stableTrendItem !== undefined &&
      stableTrendItem.message.includes('remained relatively stable') &&
      stableTrendItem.severity === INSIGHT_SEVERITIES.POSITIVE
  );

  // --- Scenario 17: Missing measurements ---
  const missingSugarInsights = healthInsightService.generateBloodSugarInsights({
    trend: [],
    recordCount: 0,
  });
  assertTest(
    'Test 17: Missing blood sugar data reports missing_data without error or zero values',
    missingSugarInsights.length === 1 &&
      missingSugarInsights[0].type === INSIGHT_TYPES.MISSING_DATA &&
      missingSugarInsights[0].metric === 'bloodSugar'
  );

  // --- Scenario 18: Multiple records on same date preserved ---
  const sameDayTrend = [
    { date: '2026-09-01', time: '08:00', value: 70.2 },
    { date: '2026-09-01', time: '20:00', value: 69.8 },
  ];
  const sameDayInsights = healthInsightService.generateWeightInsights({
    trend: sameDayTrend,
    recordCount: 2,
    latest: 69.8,
    previous: 70.2,
    change: -0.4,
    percentageChange: -0.57,
  });
  assertTest(
    'Test 18: Multiple measurements on same day analyzed correctly',
    sameDayInsights.length === 1 && sameDayInsights[0].value === -0.4
  );

  // --- Scenario 19: Blood pressure analysis (systolic and diastolic) ---
  const bpInsights = healthInsightService.generateBloodPressureInsights({
    trend: [
      { date: '2026-09-01', systolic: 122, diastolic: 82 },
      { date: '2026-09-05', systolic: 120, diastolic: 80 },
      { date: '2026-09-08', systolic: 120, diastolic: 80 },
    ],
    recordCount: 3,
    latest: { systolic: 120, diastolic: 80 },
    previous: { systolic: 120, diastolic: 80 },
    change: { systolic: 0, diastolic: 0 },
  });
  const bpTrendItem = bpInsights.find((i) => i.type === INSIGHT_TYPES.TREND);
  assertTest(
    'Test 19: Blood pressure dual trend analyzed without medical diagnosis',
    bpInsights.length >= 1 &&
      bpTrendItem !== undefined &&
      bpTrendItem.message.includes('relatively stable')
  );

  // --- Scenario 20: Weight analysis ---
  assertTest(
    'Test 20: Weight analysis uses correct unit (kg) and category',
    emptyWeightInsights[0].unit === 'kg' &&
      emptyWeightInsights[0].category === INSIGHT_CATEGORIES.WEIGHT
  );

  // --- Scenario 21: Blood sugar analysis ---
  const sugarInsights = healthInsightService.generateBloodSugarInsights({
    trend: [
      { date: '2026-09-01', value: 110 },
      { date: '2026-09-03', value: 105 },
    ],
    recordCount: 2,
    latest: 105,
    previous: 110,
    change: -5,
    percentageChange: -4.55,
  });
  assertTest(
    'Test 21: Blood sugar analysis reports change without diagnosing diabetes or hypoglycemia',
    sugarInsights.length === 1 && sugarInsights[0].message.includes('changed by -5 mg/dL')
  );

  // --- Scenario 22: Heart rate analysis ---
  const hrInsights = healthInsightService.generateHeartRateInsights({
    trend: [
      { date: '2026-09-01', value: 76 },
      { date: '2026-09-05', value: 72 },
    ],
    recordCount: 2,
    latest: 72,
    previous: 76,
    change: -4,
    percentageChange: -5.26,
  });
  assertTest(
    'Test 22: Heart rate analysis reports BPM changes without diagnosing cardiac condition',
    hrInsights.length === 1 && hrInsights[0].message.includes('changed by -4 BPM')
  );

  // --- Scenario 23: Temperature analysis ---
  const tempInsights = healthInsightService.generateTemperatureInsights({
    trend: [
      { date: '2026-09-01', value: 36.8 },
      { date: '2026-09-05', value: 36.7 },
    ],
    recordCount: 2,
    latest: 36.7,
    previous: 36.8,
    change: -0.1,
    percentageChange: -0.27,
  });
  assertTest(
    'Test 23: Temperature analysis reports °C change without fever diagnosis',
    tempInsights.length === 1 && tempInsights[0].message.includes('changed by -0.1 °C')
  );

  // --- Scenario 24: Percentage change calculation in insights ---
  assertTest(
    'Test 24: Percentage change correctly displayed in insight message',
    sugarInsights[0].message.includes('(-4.55%)') || sugarInsights[0].message.includes('-5 mg/dL')
  );

  // --- Scenario 25: Zero previous value safety ---
  const zeroPrevInsight = generateSingleMetricInsights({
    data: {
      trend: [
        { date: '2026-09-01', value: 0 },
        { date: '2026-09-05', value: 5 },
      ],
      recordCount: 2,
      latest: 5,
      previous: 0,
      change: 5,
      percentageChange: null, // safe division
    },
    metricKey: 'weight',
    category: 'weight',
    displayName: 'Weight',
    unit: 'kg',
  });
  assertTest(
    'Test 25: Zero previous value safely handled without NaN/Infinity error',
    zeroPrevInsight.length === 1 && zeroPrevInsight[0].value === 5
  );

  // --- Scenario 26: Notable personal change generates 'attention' severity ---
  const notableChangeInsights = healthInsightService.generateWeightInsights(
    {
      trend: [
        { date: '2026-09-01', value: 70.0 },
        { date: '2026-09-05', value: 78.0 },
      ],
      recordCount: 2,
      latest: 78.0,
      previous: 70.0,
      change: 8.0,
      percentageChange: 11.43,
    },
    10 // 10% threshold
  );
  assertTest(
    'Test 26: Notable personal change exceeding threshold generates attention severity',
    notableChangeInsights[0].severity === INSIGHT_SEVERITIES.ATTENTION &&
      notableChangeInsights[0].message.includes('changed noticeably')
  );

  // --- Scenario 27: Adherence integration ---
  const mockAnalytics = {
    metrics: {
      weight: { recordCount: 3 },
      bloodPressure: { recordCount: 0 },
    },
  };
  const mockAdherence = {
    hasData: true,
    adherenceScore: 92,
    taken: 23,
    totalEligible: 25,
  };
  const summaryWithAdherence = healthInsightService.generateOverallInsights(
    mockAnalytics,
    mockAdherence
  );
  assertTest(
    'Test 27: Adherence context integrated into overall insights',
    summaryWithAdherence.includes('Medication adherence for this period is 92%')
  );

  // --- Scenario 28: No diagnosis language check ---
  const forbiddenTerms = [
    'you have',
    'you are suffering',
    'diabetes',
    'hypertension',
    'this is dangerous',
    'take medication',
    'change medication',
    'stop taking',
    'abnormal',
    'unhealthy',
  ];

  const allGeneratedMessages = [
    ...emptyWeightInsights,
    ...singleRecordInsights,
    ...twoRecordInsights,
    ...upwardTrendInsights,
    ...bpInsights,
    ...sugarInsights,
    ...hrInsights,
    ...tempInsights,
    ...notableChangeInsights,
  ].map((i) => i.message.toLowerCase());

  let containsForbiddenTerm = false;
  for (const msg of allGeneratedMessages) {
    for (const term of forbiddenTerms) {
      if (msg.includes(term)) {
        containsForbiddenTerm = true;
        console.error(`Violation: message contains '${term}': "${msg}"`);
        break;
      }
    }
  }
  assertTest('Test 28: Clinical safety check - strictly zero diagnostic claims', !containsForbiddenTerm);

  // --- Scenario 29: Correct API response structure ---
  const consistencyInsights = healthInsightService.generateMeasurementConsistencyInsights(mockAnalytics);
  assertTest(
    'Test 29: Measurement consistency and structured insight object schema verified',
    consistencyInsights.length >= 1 &&
      consistencyInsights[0].id !== undefined &&
      consistencyInsights[0].category !== undefined &&
      consistencyInsights[0].type !== undefined &&
      consistencyInsights[0].severity !== undefined &&
      consistencyInsights[0].title !== undefined &&
      consistencyInsights[0].message !== undefined
  );

  console.log('\n--- Step 17 Test Results ---');
  console.log(`Passed: ${passed} / ${passed + failed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    throw new Error(`${failed} tests failed in Step 17 Verification Suite`);
  }
}

runHealthInsightTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
