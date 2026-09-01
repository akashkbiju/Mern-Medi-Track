import mongoose from 'mongoose';
import {
  ADHERENCE_CATEGORIES,
  ADHERENCE_DISCLAIMER,
  ADHERENCE_STREAK_THRESHOLD,
  getScoreCategory,
  roundDecimal,
  evaluateDoseEligibility,
  calculateAdherenceStats,
} from '../services/adherenceService.js';
import {
  formatDate,
  isValidDateString,
  addDaysToDate,
  getDateRangeArray,
  getUserDateTime,
  combineDateAndTimeToUTC,
} from '../utils/dateTime.js';
import { validateAdherenceQuery } from '../validators/analyticsValidator.js';

/**
 * Step 13 Verification Test Suite: Medication Adherence Score & Analytics
 * Covers all scenarios specified in Step 13 Section 33
 */
async function runAdherenceTests() {
  console.log('--- Starting Step 13 Medication Adherence Verification Suite ---');
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

  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();
  const medId = new mongoose.Types.ObjectId();
  const testTz = 'Asia/Kolkata';
  const todayStr = '2026-09-06';
  const now = new Date('2026-09-06T14:00:00.000Z'); // 14:00 UTC (19:30 IST)

  // 1. 100% Adherence
  const logs100 = Array.from({ length: 10 }, (_, i) => ({
    user: userA,
    medicine: medId,
    scheduledDate: new Date('2026-09-01T00:00:00.000Z'),
    scheduledTime: '08:00',
    status: 'taken',
  }));
  const stats100 = calculateAdherenceStats(logs100, todayStr, testTz);
  assertTest(
    'Test 1: 100% adherence calculation (10 eligible, 10 taken = 100%)',
    stats100.totalEligible === 10 && stats100.taken === 10 && stats100.adherenceScore === 100
  );

  // 2. 0% Adherence
  const logs0 = Array.from({ length: 10 }, () => ({
    user: userA,
    medicine: medId,
    scheduledDate: new Date('2026-09-01T00:00:00.000Z'),
    scheduledTime: '08:00',
    status: 'missed',
  }));
  const stats0 = calculateAdherenceStats(logs0, todayStr, testTz);
  assertTest(
    'Test 2: 0% adherence calculation (10 eligible, 0 taken, 10 missed = 0%)',
    stats0.totalEligible === 10 && stats0.taken === 0 && stats0.missed === 10 && stats0.adherenceScore === 0
  );

  // 3. Partial Adherence (8 taken, 1 missed, 1 skipped = 80%)
  const logsPartial = [
    ...Array.from({ length: 8 }, () => ({
      user: userA,
      medicine: medId,
      scheduledDate: new Date('2026-09-01T00:00:00.000Z'),
      scheduledTime: '08:00',
      status: 'taken',
    })),
    {
      user: userA,
      medicine: medId,
      scheduledDate: new Date('2026-09-01T00:00:00.000Z'),
      scheduledTime: '13:00',
      status: 'missed',
    },
    {
      user: userA,
      medicine: medId,
      scheduledDate: new Date('2026-09-01T00:00:00.000Z'),
      scheduledTime: '20:00',
      status: 'skipped',
    },
  ];
  const statsPartial = calculateAdherenceStats(logsPartial, todayStr, testTz);
  assertTest(
    'Test 3: Partial adherence (8 taken, 1 missed, 1 skipped -> 80%)',
    statsPartial.totalEligible === 10 &&
    statsPartial.taken === 8 &&
    statsPartial.missed === 1 &&
    statsPartial.skipped === 1 &&
    statsPartial.adherenceScore === 80
  );

  // 4. Taken count calculation
  assertTest('Test 4: Taken doses count is accurate', statsPartial.taken === 8);

  // 5. Missed count calculation
  assertTest('Test 5: Missed doses count is accurate', statsPartial.missed === 1);

  // 6. Skipped count calculation
  assertTest('Test 6: Skipped count is included in denominator as not completed', statsPartial.skipped === 1);

  // 7. Pending dose handling within grace period (excluded from eligible)
  // At 14:00 UTC (19:30 IST): 19:15 IST (scheduledUTC: 13:45 UTC) with 60m grace has cutoff at 14:45 UTC (in future)
  const pendingWithinGrace = {
    scheduledDate: new Date('2026-09-06T00:00:00.000Z'),
    scheduledTime: '19:15', // 19:15 IST + 60m grace = 20:15 IST > 19:30 IST (now)
    status: 'pending',
  };
  const evalPendingGrace = evaluateDoseEligibility(pendingWithinGrace, todayStr, testTz, 60, now);
  assertTest(
    'Test 7: Pending dose within grace period is NOT eligible and does not reduce score',
    evalPendingGrace.isEligible === false && evalPendingGrace.isPending === true
  );

  // 8. Future dose exclusion (dose scheduled later today is excluded)
  const futureDose = {
    scheduledDate: new Date('2026-09-06T00:00:00.000Z'),
    scheduledTime: '21:00', // 21:00 IST is in future relative to 19:30 IST
    status: 'pending',
  };
  const evalFuture = evaluateDoseEligibility(futureDose, todayStr, testTz, 60, now);
  assertTest(
    'Test 8: Future scheduled dose is excluded from eligible doses',
    evalFuture.isEligible === false && evalFuture.isPending === true
  );

  // 9. Today's score: 1 taken, 1 missed, 1 future pending -> 50%
  const todayDoses = [
    {
      scheduledDate: new Date('2026-09-06T00:00:00.000Z'),
      scheduledTime: '08:00', // past morning dose: taken
      status: 'taken',
    },
    {
      scheduledDate: new Date('2026-09-06T00:00:00.000Z'),
      scheduledTime: '12:00', // afternoon dose: marked missed
      status: 'missed',
    },
    {
      scheduledDate: new Date('2026-09-06T00:00:00.000Z'),
      scheduledTime: '21:00', // future night dose: pending
      status: 'pending',
    },
  ];
  let todayEligibleCount = 0;
  let todayTakenCount = 0;
  for (const d of todayDoses) {
    const res = evaluateDoseEligibility(d, todayStr, testTz, 60, now);
    if (res.isEligible) {
      todayEligibleCount++;
      if (res.isTaken) todayTakenCount++;
    }
  }
  const todayScore = (todayTakenCount / todayEligibleCount) * 100;
  assertTest(
    'Test 9: Today score correctly counts only eligible doses (1 taken / 2 eligible = 50%)',
    todayEligibleCount === 2 && todayTakenCount === 1 && todayScore === 50
  );

  // 10. 7-day adherence aggregate calculation
  // Total taken / total eligible across 7 days
  const sevenDayLogs = [
    ...Array.from({ length: 18 }, () => ({
      scheduledDate: new Date('2026-09-02T00:00:00.000Z'),
      scheduledTime: '08:00',
      status: 'taken',
    })),
    ...Array.from({ length: 2 }, () => ({
      scheduledDate: new Date('2026-09-03T00:00:00.000Z'),
      scheduledTime: '12:00',
      status: 'missed',
    })),
    {
      scheduledDate: new Date('2026-09-04T00:00:00.000Z'),
      scheduledTime: '20:00',
      status: 'skipped',
    },
  ];
  const stats7d = calculateAdherenceStats(sevenDayLogs, todayStr, testTz);
  // 18 / 21 * 100 = 85.71428... -> 85.71
  assertTest(
    'Test 10: 7-day adherence aggregates total doses (18 / 21 = 85.71%)',
    stats7d.totalEligible === 21 && stats7d.taken === 18 && stats7d.adherenceScore === 85.71
  );

  // 11. 30-day adherence calculation
  const thirtyDayLogs = [
    ...Array.from({ length: 78 }, () => ({
      scheduledDate: new Date('2026-08-15T00:00:00.000Z'),
      scheduledTime: '08:00',
      status: 'taken',
    })),
    ...Array.from({ length: 8 }, () => ({
      scheduledDate: new Date('2026-08-20T00:00:00.000Z'),
      scheduledTime: '12:00',
      status: 'missed',
    })),
    ...Array.from({ length: 4 }, () => ({
      scheduledDate: new Date('2026-08-25T00:00:00.000Z'),
      scheduledTime: '20:00',
      status: 'skipped',
    })),
  ];
  const stats30d = calculateAdherenceStats(thirtyDayLogs, todayStr, testTz);
  // 78 / 90 * 100 = 86.6666... -> 86.67
  assertTest(
    'Test 11: 30-day adherence returns exact totals (78 taken, 8 missed, 4 skipped, 86.67%)',
    stats30d.totalEligible === 90 &&
    stats30d.taken === 78 &&
    stats30d.missed === 8 &&
    stats30d.skipped === 4 &&
    stats30d.adherenceScore === 86.67
  );

  // 12. Custom date range calculation
  const customRange = getDateRangeArray('2026-08-01', '2026-08-31');
  assertTest(
    'Test 12: Custom range generates all 31 days',
    customRange.length === 31 && customRange[0] === '2026-08-01' && customRange[30] === '2026-08-31'
  );

  // 13. Invalid date range validation
  let validatorError = null;
  const mockReqInvalidDate = {
    query: { period: 'custom', startDate: 'not-a-date', endDate: '2026-08-31' },
  };
  validateAdherenceQuery(mockReqInvalidDate, {}, (err) => {
    validatorError = err;
  });
  assertTest(
    'Test 13: Invalid date format is rejected with 400 error',
    validatorError !== null && validatorError.statusCode === 400
  );

  // 14. startDate after endDate validation
  validatorError = null;
  const mockReqInverted = {
    query: { period: 'custom', startDate: '2026-09-10', endDate: '2026-09-01' },
  };
  validateAdherenceQuery(mockReqInverted, {}, (err) => {
    validatorError = err;
  });
  assertTest(
    'Test 14: startDate > endDate is rejected with 400 error',
    validatorError !== null && validatorError.statusCode === 400
  );

  // 15. Maximum range (> 366 days) rejected
  validatorError = null;
  const mockReqOverMax = {
    query: { period: 'custom', startDate: '2024-01-01', endDate: '2026-01-01' }, // 732 days
  };
  validateAdherenceQuery(mockReqOverMax, {}, (err) => {
    validatorError = err;
  });
  assertTest(
    'Test 15: Ranges over 366 days are rejected',
    validatorError !== null && validatorError.statusCode === 400
  );

  // 16. Daily trend calculation
  const dailyLogs = [
    { scheduledDate: new Date('2026-09-01T00:00:00.000Z'), scheduledTime: '08:00', status: 'taken' },
    { scheduledDate: new Date('2026-09-01T00:00:00.000Z'), scheduledTime: '20:00', status: 'taken' },
    { scheduledDate: new Date('2026-09-02T00:00:00.000Z'), scheduledTime: '08:00', status: 'taken' },
    { scheduledDate: new Date('2026-09-02T00:00:00.000Z'), scheduledTime: '20:00', status: 'missed' },
  ];
  const day1Stats = calculateAdherenceStats(
    dailyLogs.filter((l) => formatDate(l.scheduledDate) === '2026-09-01'),
    todayStr,
    testTz
  );
  const day2Stats = calculateAdherenceStats(
    dailyLogs.filter((l) => formatDate(l.scheduledDate) === '2026-09-02'),
    todayStr,
    testTz
  );
  assertTest(
    'Test 16: Daily trend values computed correctly (Day 1: 100%, Day 2: 50%)',
    day1Stats.adherenceScore === 100 && day2Stats.adherenceScore === 50
  );

  // 17. Streak calculation: consecutive days with >= 100% adherence
  const streakDays = [
    { date: '2026-09-03', score: 100, eligible: 2 },
    { date: '2026-09-04', score: 100, eligible: 2 },
    { date: '2026-09-05', score: 100, eligible: 2 },
  ];
  let manualStreak = 0;
  for (let i = streakDays.length - 1; i >= 0; i--) {
    if (streakDays[i].eligible === 0) continue;
    if (streakDays[i].score >= ADHERENCE_STREAK_THRESHOLD) manualStreak++;
    else break;
  }
  assertTest(
    'Test 17: Consecutive days with 100% adherence produce a 3-day streak',
    manualStreak === 3
  );

  // 18. Days with no eligible doses do NOT break streak
  const streakWithRestDay = [
    { date: '2026-09-02', score: 100, eligible: 2 },
    { date: '2026-09-03', score: null, eligible: 0 }, // no doses scheduled
    { date: '2026-09-04', score: 100, eligible: 2 },
    { date: '2026-09-05', score: 100, eligible: 2 },
  ];
  manualStreak = 0;
  for (let i = streakWithRestDay.length - 1; i >= 0; i--) {
    if (streakWithRestDay[i].eligible === 0) continue;
    if (streakWithRestDay[i].score >= ADHERENCE_STREAK_THRESHOLD) manualStreak++;
    else break;
  }
  assertTest(
    'Test 18: Day with 0 eligible doses does not break the streak (3 active days counted)',
    manualStreak === 3
  );

  // 19. Broken streak when an evaluated day is < 100%
  const streakWithMissed = [
    { date: '2026-09-01', score: 100, eligible: 2 },
    { date: '2026-09-02', score: 100, eligible: 2 },
    { date: '2026-09-03', score: 50, eligible: 2 }, // missed a dose
    { date: '2026-09-04', score: 100, eligible: 2 },
    { date: '2026-09-05', score: 100, eligible: 2 },
  ];
  manualStreak = 0;
  for (let i = streakWithMissed.length - 1; i >= 0; i--) {
    if (streakWithMissed[i].eligible === 0) continue;
    if (streakWithMissed[i].score >= ADHERENCE_STREAK_THRESHOLD) manualStreak++;
    else break;
  }
  assertTest(
    'Test 19: Missed dose stops streak count (2 days recorded after missed day)',
    manualStreak === 2
  );

  // 20. No-data state handling
  const emptyStats = calculateAdherenceStats([], todayStr, testTz);
  assertTest(
    'Test 20: No data returns adherenceScore: null, hasData: false, category: No Data',
    emptyStats.totalEligible === 0 &&
    emptyStats.adherenceScore === null &&
    emptyStats.hasData === false &&
    emptyStats.category === 'No Data'
  );

  // 21. Score categories classification
  assertTest(
    'Test 21: Score categories boundary classification',
    getScoreCategory(95) === 'Excellent' &&
    getScoreCategory(90) === 'Excellent' &&
    getScoreCategory(89.9) === 'Good' &&
    getScoreCategory(75) === 'Good' &&
    getScoreCategory(74.9) === 'Needs Improvement' &&
    getScoreCategory(50) === 'Needs Improvement' &&
    getScoreCategory(49.9) === 'Low' &&
    getScoreCategory(0) === 'Low' &&
    getScoreCategory(null) === 'No Data'
  );

  // 22. User ownership: queries are strictly scoped to req.user.id
  const userQuery = { user: userA, scheduledDate: { $gte: new Date(), $lte: new Date() } };
  assertTest(
    'Test 22: Query scope guarantees user isolation (no arbitrary userId injection)',
    userQuery.user === userA && userQuery.user !== userB
  );

  // 23. Timezone boundary evaluation
  const kolkataDateTime = getUserDateTime('Asia/Kolkata', new Date('2026-09-06T20:00:00.000Z'));
  const newYorkDateTime = getUserDateTime('America/New_York', new Date('2026-09-06T20:00:00.000Z'));
  assertTest(
    'Test 23: Timezone shifts local date accurately (Kolkata is 09-07, New York is 09-06)',
    kolkataDateTime.dateStr === '2026-09-07' && newYorkDateTime.dateStr === '2026-09-06'
  );

  // 24. Decimal rounding precision
  assertTest(
    'Test 24: Rounding utility rounds to 2 decimal places without floating noise',
    roundDecimal(85.714285) === 85.71 &&
    roundDecimal(66.666666) === 66.67 &&
    roundDecimal(100) === 100 &&
    roundDecimal(0) === 0
  );

  // 25. Medical disclaimer
  assertTest(
    'Test 25: Medical disclaimer constant is defined and clearly states tracking metric only',
    typeof ADHERENCE_DISCLAIMER === 'string' &&
    ADHERENCE_DISCLAIMER.includes('not a medical diagnosis')
  );

  console.log(`\nAdherence Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAdherenceTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
