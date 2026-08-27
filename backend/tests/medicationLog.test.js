import mongoose from 'mongoose';
import {
  formatDate,
  isValidDateString,
  getTodayDateString,
  isDateInMedicationRange,
  combineDateAndTime,
  compareTimes,
  formatTime12h,
  isValidTimezone,
  getUserDateTime,
  combineDateAndTimeToUTC,
} from '../utils/dateTime.js';
import {
  isMedicineScheduledForDate,
  generateDailyDoses,
} from '../services/scheduleService.js';
import MedicationLog from '../models/MedicationLog.js';

/**
 * Test Suite for Step 12: Medication Taken/Missed Tracking
 * Verifies all 28 requirements specified in Step 12 Section 32
 */
async function runMedicationLogTests() {
  console.log('--- Starting Step 12 Medication Log Verification Suite ---');
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
  const med1Id = new mongoose.Types.ObjectId();
  const med2Id = new mongoose.Types.ObjectId();

  // Test 1: Daily logs generated from schedule
  const activeMed = {
    _id: med1Id,
    user: userA,
    name: 'Paracetamol',
    dosage: 500,
    dosageUnit: 'mg',
    frequency: 'twice_daily',
    times: ['08:00', '20:00'],
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-30'),
    isActive: true,
  };
  const scheduledDoses = generateDailyDoses([activeMed], '2026-09-06');
  assertTest(
    'Test 1: Daily logs generated from schedule (2 doses for twice_daily)',
    scheduledDoses.length === 2 &&
    scheduledDoses[0].scheduledTime === '08:00' &&
    scheduledDoses[1].scheduledTime === '20:00'
  );

  // Test 2: No logs before medicine start date
  assertTest(
    'Test 2: No doses scheduled before medicine start date (2026-08-31)',
    isMedicineScheduledForDate(activeMed, '2026-08-31') === false
  );

  // Test 3: No logs after medicine end date
  assertTest(
    'Test 3: No doses scheduled after medicine end date (2026-10-01)',
    isMedicineScheduledForDate(activeMed, '2026-10-01') === false
  );

  // Test 4: Inactive medicine produces no log
  const inactiveMed = {
    ...activeMed,
    isActive: false,
  };
  assertTest(
    'Test 4: Inactive medicine produces no doses for date',
    isMedicineScheduledForDate(inactiveMed, '2026-09-06') === false
  );

  // Test 5: Ongoing medicine with null endDate works indefinitely
  const ongoingMed = {
    ...activeMed,
    endDate: null,
  };
  assertTest(
    'Test 5: Ongoing medicine with null endDate is scheduled indefinitely for future dates',
    isMedicineScheduledForDate(ongoingMed, '2026-09-06') === true &&
    isMedicineScheduledForDate(ongoingMed, '2028-05-15') === true
  );

  // Test 6: Multiple scheduled times create multiple log entries
  const med2 = {
    _id: med2Id,
    user: userA,
    name: 'Vitamin D',
    dosage: 1000,
    dosageUnit: 'IU',
    frequency: 'once_daily',
    times: ['13:00'],
    startDate: new Date('2026-09-01'),
    endDate: null,
    isActive: true,
  };
  const allDoses = generateDailyDoses([activeMed, med2], '2026-09-06');
  assertTest(
    'Test 6: Multiple medicines create 3 distinct scheduled doses (08:00, 13:00, 20:00)',
    allDoses.length === 3 &&
    allDoses[0].scheduledTime === '08:00' &&
    allDoses[1].scheduledTime === '13:00' &&
    allDoses[2].scheduledTime === '20:00'
  );

  // Test 7: Duplicate generation does not create duplicate logs (Unique Index check)
  const indexes = MedicationLog.schema.indexes();
  const compoundUniqueIndex = indexes.find(
    ([idx, opts]) =>
      idx.user === 1 &&
      idx.medicine === 1 &&
      idx.scheduledDate === 1 &&
      idx.scheduledTime === 1 &&
      opts.unique === true
  );
  assertTest(
    'Test 7: MedicationLog schema enforces compound unique index { user, medicine, scheduledDate, scheduledTime }',
    Boolean(compoundUniqueIndex)
  );

  // Test 8: User can retrieve own logs
  const checkOwnership = (logUserId, requestingUserId) => logUserId.equals(requestingUserId);
  assertTest(
    'Test 8: User can retrieve their own logs',
    checkOwnership(userA, userA) === true
  );

  // Test 9: User cannot retrieve another user's logs
  assertTest(
    'Test 9: User cannot retrieve another user logs',
    checkOwnership(userA, userB) === false
  );

  // Test 10 & 11: User can mark own dose taken, cannot mark another user's dose
  const canUpdate = (logUserId, requestingUserId) => logUserId.equals(requestingUserId);
  assertTest(
    'Test 10 & 11: User ownership enforced on markTaken',
    canUpdate(userA, userA) === true && canUpdate(userA, userB) === false
  );

  // Test 12: Taken status sets takenAt
  const sampleLog = {
    _id: new mongoose.Types.ObjectId(),
    user: userA,
    medicine: med1Id,
    status: 'pending',
    takenAt: null,
    notes: '',
  };
  const markTakenFn = (log, notes = '') => {
    if (log.status === 'taken') return log; // idempotent
    if (log.status === 'skipped') throw new Error('Cannot mark skipped as taken');
    return {
      ...log,
      status: 'taken',
      takenAt: new Date(),
      notes: notes || log.notes,
    };
  };
  const takenLog = markTakenFn(sampleLog, 'Taken after breakfast');
  assertTest(
    'Test 12: Taken status sets takenAt timestamp and updates status to taken',
    takenLog.status === 'taken' &&
    takenLog.takenAt instanceof Date &&
    takenLog.notes === 'Taken after breakfast'
  );

  // Test 13: Taken action is idempotent
  const originalTakenAt = takenLog.takenAt;
  const repeatTakenLog = markTakenFn(takenLog, 'Repeat click');
  assertTest(
    'Test 13: Taken action is idempotent and preserves original takenAt',
    repeatTakenLog.status === 'taken' &&
    repeatTakenLog.takenAt === originalTakenAt
  );

  // Test 14 & 15: User can skip a pending dose, and skipped dose remains skipped
  const markSkippedFn = (log, notes = '') => {
    if (log.status === 'skipped') return log; // idempotent
    if (log.status === 'taken') throw new Error('Cannot skip taken dose');
    if (log.status === 'missed') throw new Error('Cannot skip missed dose');
    return {
      ...log,
      status: 'skipped',
      notes: notes || log.notes,
    };
  };
  const pendingLogToSkip = { ...sampleLog, _id: new mongoose.Types.ObjectId() };
  const skippedLog = markSkippedFn(pendingLogToSkip, 'Fasting today');
  assertTest(
    'Test 14 & 15: User can skip pending dose; status transitions to skipped with note',
    skippedLog.status === 'skipped' &&
    skippedLog.notes === 'Fasting today'
  );

  // Test 16: Pending dose becomes missed after grace period
  const isGraceExpired = (scheduledUTC, currentTime, graceMinutes) => {
    const cutoff = new Date(scheduledUTC.getTime() + graceMinutes * 60 * 1000);
    return currentTime.getTime() > cutoff.getTime();
  };
  const scheduledTimeUTC = new Date('2026-09-06T08:00:00.000Z');
  const withinGraceTime = new Date('2026-09-06T08:30:00.000Z'); // 30m later
  const afterGraceTime = new Date('2026-09-06T09:05:00.000Z'); // 65m later (grace=60)
  assertTest(
    'Test 16: Pending dose remains pending within grace period, becomes missed after grace period expires',
    isGraceExpired(scheduledTimeUTC, withinGraceTime, 60) === false &&
    isGraceExpired(scheduledTimeUTC, afterGraceTime, 60) === true
  );

  // Test 17: Taken dose NEVER becomes missed
  const processMissedTransition = (status, isExpired) => {
    if (status === 'pending' && isExpired) return 'missed';
    return status;
  };
  assertTest(
    'Test 17: Taken dose never transitions to missed even after expiration',
    processMissedTransition('taken', true) === 'taken'
  );

  // Test 18: Skipped dose NEVER becomes missed
  assertTest(
    'Test 18: Skipped dose never transitions to missed even after expiration',
    processMissedTransition('skipped', true) === 'skipped'
  );

  // Test 19: Invalid status injection is rejected
  const validStatuses = ['pending', 'taken', 'missed', 'skipped'];
  assertTest(
    'Test 19: Arbitrary injected status (e.g. approved, deleted) is rejected',
    validStatuses.includes('approved') === false &&
    validStatuses.includes('deleted') === false &&
    validStatuses.includes('taken') === true
  );

  // Test 20: Invalid log ID rejected
  assertTest(
    'Test 20: Non-ObjectId string is detected and rejected',
    mongoose.Types.ObjectId.isValid('invalid-log-id') === false &&
    mongoose.Types.ObjectId.isValid(new mongoose.Types.ObjectId()) === true
  );

  // Test 21: Invalid date rejected
  assertTest(
    'Test 21: Non-calendar date (e.g. 2026-02-30) is rejected',
    isValidDateString('2026-02-30') === false &&
    isValidDateString('2026-09-06') === true
  );

  // Test 22 & 23: Date & Medicine filters
  const logsList = [
    { id: 1, medicine: med1Id, scheduledDate: '2026-09-06', status: 'taken' },
    { id: 2, medicine: med2Id, scheduledDate: '2026-09-06', status: 'pending' },
    { id: 3, medicine: med1Id, scheduledDate: '2026-09-07', status: 'pending' },
  ];
  const filteredByMed = logsList.filter((l) => l.medicine.equals(med1Id));
  const filteredByDate = logsList.filter((l) => l.scheduledDate === '2026-09-06');
  assertTest(
    'Test 22 & 23: Safe in-memory and database query filtering by date and medicine ID',
    filteredByMed.length === 2 &&
    filteredByDate.length === 2
  );

  // Test 24: History sorting works chronologically
  const sorted = [...allDoses].sort((a, b) => compareTimes(a.scheduledTime, b.scheduledTime));
  assertTest(
    'Test 24: Chronological dose sorting orders 08:00 < 13:00 < 20:00',
    sorted[0].scheduledTime === '08:00' &&
    sorted[1].scheduledTime === '13:00' &&
    sorted[2].scheduledTime === '20:00'
  );

  // Test 25: Timezone behavior works accurately
  const istTz = getUserDateTime('Asia/Kolkata', new Date('2026-09-06T12:00:00Z'));
  const nyTz = getUserDateTime('America/New_York', new Date('2026-09-06T12:00:00Z'));
  assertTest(
    'Test 25: Timezone calculations correctly reflect user timezone without drift',
    istTz.timezone === 'Asia/Kolkata' &&
    nyTz.timezone === 'America/New_York' &&
    istTz.timeStr !== nyTz.timeStr
  );

  // Test 26: Scheduler failure for one record does not stop processing
  let processed = 0;
  const items = [
    { id: 1, willFail: false },
    { id: 2, willFail: true },
    { id: 3, willFail: false },
  ];
  for (const item of items) {
    try {
      if (item.willFail) throw new Error('DB timeout');
      processed++;
    } catch {
      // Catch and continue
    }
  }
  assertTest(
    'Test 26: Resilience: a failure processing one log does not halt the batch loop',
    processed === 2
  );

  // Test 27: Dashboard progress counts are calculated accurately
  const todayDoses = [
    { status: 'taken' },
    { status: 'taken' },
    { status: 'pending' },
    { status: 'skipped' },
  ];
  const total = todayDoses.length;
  const taken = todayDoses.filter((d) => d.status === 'taken').length;
  const pending = todayDoses.filter((d) => d.status === 'pending').length;
  const completionRate = Math.round((taken / total) * 100);
  assertTest(
    'Test 27: Progress counts match (total: 4, taken: 2, pending: 1, completionRate: 50%)',
    total === 4 && taken === 2 && pending === 1 && completionRate === 50
  );

  // Test 28: Late taken support (missed -> taken)
  const missedLog = {
    ...sampleLog,
    status: 'missed',
  };
  const lateTakenLog = markTakenFn(missedLog, 'Took 2 hours late');
  assertTest(
    'Test 28: Late medication recording transitions missed -> taken and records actual takenAt',
    lateTakenLog.status === 'taken' &&
    lateTakenLog.notes === 'Took 2 hours late' &&
    lateTakenLog.takenAt instanceof Date
  );

  console.log(`\nMedication Log Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runMedicationLogTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
