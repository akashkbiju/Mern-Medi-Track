import mongoose from 'mongoose';
import {
  formatDate,
  isValidDateString,
  getTodayDateString,
  isDateInMedicationRange,
  combineDateAndTime,
  compareTimes,
  formatTime12h,
} from '../utils/dateTime.js';
import {
  isMedicineScheduledForDate,
  getScheduledTimes,
  generateDailyDoses,
} from '../services/scheduleService.js';

/**
 * Test Runner for Medication Scheduling Engine
 * Verifies all 15 schedule scenarios and calculations
 */
async function runScheduleTests() {
  console.log('--- Starting Medication Scheduling Engine Verification Suite ---');
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

  const dummyUserId = new mongoose.Types.ObjectId();
  const dummyMedicineId = new mongoose.Types.ObjectId();

  // Test 1: Date string validation
  assertTest(
    'Scenario 1: Valid YYYY-MM-DD strings are recognized as valid',
    isValidDateString('2026-09-06') === true &&
    isValidDateString('2024-02-29') === true && // Leap year
    isValidDateString('2026-02-29') === false && // Non-leap year
    isValidDateString('invalid-date') === false &&
    isValidDateString('2026-99-99') === false
  );

  // Test 2: Date formatting
  const testDate = new Date('2026-09-06T12:00:00Z');
  assertTest(
    'Scenario 2: formatDate outputs strictly YYYY-MM-DD',
    formatDate(testDate) === '2026-09-06'
  );

  // Test 3: isDateInMedicationRange inside valid boundary
  assertTest(
    'Scenario 3: isDateInMedicationRange returns true for date between start and end date inclusive',
    isDateInMedicationRange('2026-09-10', '2026-09-01', '2026-09-30') === true &&
    isDateInMedicationRange('2026-09-01', '2026-09-01', '2026-09-30') === true &&
    isDateInMedicationRange('2026-09-30', '2026-09-01', '2026-09-30') === true
  );

  // Test 4: isDateInMedicationRange outside boundary
  assertTest(
    'Scenario 4: isDateInMedicationRange returns false for date outside start or end date',
    isDateInMedicationRange('2026-08-31', '2026-09-01', '2026-09-30') === false &&
    isDateInMedicationRange('2026-10-01', '2026-09-01', '2026-09-30') === false
  );

  // Test 5: isDateInMedicationRange with null/undefined endDate (indefinite prescription)
  assertTest(
    'Scenario 5: isDateInMedicationRange allows indefinite end date if targetDate >= startDate',
    isDateInMedicationRange('2026-09-01', '2026-09-01', null) === true &&
    isDateInMedicationRange('2030-01-01', '2026-09-01', undefined) === true &&
    isDateInMedicationRange('2026-08-31', '2026-09-01', null) === false
  );

  // Test 6: 12-hour time formatting
  assertTest(
    'Scenario 6: formatTime12h converts 24h string to 12h AM/PM representation correctly',
    formatTime12h('08:00') === '08:00 AM' &&
    formatTime12h('12:00') === '12:00 PM' &&
    formatTime12h('00:15') === '12:15 AM' &&
    formatTime12h('20:45') === '08:45 PM'
  );

  // Test 7: compareTimes sorting helper
  assertTest(
    'Scenario 7: compareTimes sorts times chronologically',
    compareTimes('08:00', '14:00') < 0 &&
    compareTimes('20:00', '08:00') > 0 &&
    compareTimes('09:30', '09:30') === 0
  );

  // Test 8: Active medicine with frequency scheduled correctly
  const activeTwiceDaily = {
    _id: dummyMedicineId,
    user: dummyUserId,
    name: 'Metformin',
    dosage: 500,
    dosageUnit: 'mg',
    frequency: 'twice_daily',
    times: ['08:00', '20:00'],
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-30'),
    instructions: 'Take with food',
    isActive: true,
  };
  assertTest(
    'Scenario 8: isMedicineScheduledForDate returns true for active medicine within date range',
    isMedicineScheduledForDate(activeTwiceDaily, '2026-09-06') === true
  );

  // Test 9: Inactive medicine is NOT scheduled
  const inactiveMedicine = {
    ...activeTwiceDaily,
    isActive: false,
  };
  assertTest(
    'Scenario 9: Inactive medicine (isActive: false) is NOT scheduled',
    isMedicineScheduledForDate(inactiveMedicine, '2026-09-06') === false
  );

  // Test 10: Medicine with future start date is NOT scheduled
  const futureMedicine = {
    ...activeTwiceDaily,
    startDate: new Date('2026-09-15'),
  };
  assertTest(
    'Scenario 10: Medicine with future start date is NOT scheduled for prior dates',
    isMedicineScheduledForDate(futureMedicine, '2026-09-06') === false
  );

  // Test 11: Medicine with past end date is NOT scheduled
  const expiredMedicine = {
    ...activeTwiceDaily,
    endDate: new Date('2026-09-05'),
  };
  assertTest(
    'Scenario 11: Medicine with past end date is NOT scheduled for later dates',
    isMedicineScheduledForDate(expiredMedicine, '2026-09-06') === false
  );

  // Test 12: getScheduledTimes respects medicine times
  assertTest(
    'Scenario 12: getScheduledTimes returns sorted times for frequency',
    JSON.stringify(getScheduledTimes(activeTwiceDaily, '2026-09-06')) === JSON.stringify(['08:00', '20:00'])
  );

  // Test 13: combineDateAndTime creates correct ISO date time
  const combined = combineDateAndTime('2026-09-06', '08:30');
  assertTest(
    'Scenario 13: combineDateAndTime constructs exact Date object',
    combined instanceof Date &&
    !isNaN(combined.getTime()) &&
    combined.getFullYear() === 2026 &&
    combined.getMonth() === 8 && // September is 8
    combined.getDate() === 6
  );

  // Test 14: generateDailyDoses outputs expected chronological doses with status Scheduled
  const medA = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Aspirin',
    dosage: 75,
    dosageUnit: 'mg',
    frequency: 'once_daily',
    times: ['21:00'],
    startDate: new Date('2026-09-01'),
    endDate: null,
    isActive: true,
  };
  const medB = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Metformin',
    dosage: 500,
    dosageUnit: 'mg',
    frequency: 'twice_daily',
    times: ['08:00', '19:00'],
    startDate: new Date('2026-09-01'),
    endDate: null,
    isActive: true,
  };
  const dailyDoses = generateDailyDoses([medA, medB, inactiveMedicine], '2026-09-06');
  assertTest(
    'Scenario 14: generateDailyDoses produces chronological order across multiple medications and excludes inactive',
    dailyDoses.length === 3 &&
    dailyDoses[0].medicineName === 'Metformin' &&
    dailyDoses[0].scheduledTime === '08:00' &&
    dailyDoses[0].scheduledTime12h === '08:00 AM' &&
    dailyDoses[0].status === 'Scheduled' &&
    dailyDoses[1].medicineName === 'Metformin' &&
    dailyDoses[1].scheduledTime === '19:00' &&
    dailyDoses[2].medicineName === 'Aspirin' &&
    dailyDoses[2].scheduledTime === '21:00'
  );

  // Test 15: generateDailyDoses returns empty array when no medicines are active or valid for date
  const emptyDoses = generateDailyDoses([inactiveMedicine, futureMedicine], '2026-09-06');
  assertTest(
    'Scenario 15: generateDailyDoses returns empty array when no medicines qualify for target date',
    Array.isArray(emptyDoses) && emptyDoses.length === 0
  );

  console.log(`\nSchedule Engine Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runScheduleTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
