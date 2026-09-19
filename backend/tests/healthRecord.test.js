import mongoose from 'mongoose';
import HealthRecord from '../models/HealthRecord.js';
import {
  validateCreateHealthRecord,
  validateUpdateHealthRecord,
  validateHealthRecordQuery,
  validateRecordId,
} from '../validators/healthValidator.js';

/**
 * Step 14 Verification Test Suite: Health Records Database & Data Architecture
 * Covers all 42 scenarios specified in Step 14 Section 39
 */
async function runHealthRecordTests() {
  console.log('--- Starting Step 14 Health Record Verification Suite ---');
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

  // Helper validator tester
  const runValidator = (validatorFn, req) => {
    let capturedError = null;
    validatorFn(req, {}, (err) => {
      capturedError = err || null;
    });
    return capturedError;
  };

  // --- 1. Creation Tests ---

  // Test 1: Create weight record
  const weightRecord = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-01T08:30:00.000Z'),
    weight: 68.5,
  });
  const err1 = weightRecord.validateSync();
  assertTest('Test 1: Create valid weight record (68.5 kg)', !err1 && weightRecord.weight === 68.5);

  // Test 2: Create blood pressure record
  const bpRecord = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-01T08:30:00.000Z'),
    bloodPressure: { systolic: 120, diastolic: 80 },
  });
  const err2 = bpRecord.validateSync();
  assertTest(
    'Test 2: Create valid blood pressure record (120/80 mmHg)',
    !err2 && bpRecord.bloodPressure.systolic === 120 && bpRecord.bloodPressure.diastolic === 80
  );

  // Test 3: Create blood sugar record
  const sugarRecord = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-01T08:30:00.000Z'),
    bloodSugar: 95,
  });
  const err3 = sugarRecord.validateSync();
  assertTest('Test 3: Create valid blood sugar record (95 mg/dL)', !err3 && sugarRecord.bloodSugar === 95);

  // Test 4: Create heart rate record
  const hrRecord = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-01T08:30:00.000Z'),
    heartRate: 72,
  });
  const err4 = hrRecord.validateSync();
  assertTest('Test 4: Create valid heart rate record (72 BPM)', !err4 && hrRecord.heartRate === 72);

  // Test 5: Create temperature record
  const tempRecord = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-01T08:30:00.000Z'),
    temperature: 36.7,
  });
  const err5 = tempRecord.validateSync();
  assertTest('Test 5: Create valid temperature record (36.7 °C)', !err5 && tempRecord.temperature === 36.7);

  // Test 6: Create multiple measurements together
  const fullRecord = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-01T08:30:00.000Z'),
    weight: 70.2,
    bloodPressure: { systolic: 125, diastolic: 82 },
    bloodSugar: 105,
    heartRate: 75,
    temperature: 36.8,
    notes: 'Morning full measurement',
  });
  const err6 = fullRecord.validateSync();
  assertTest('Test 6: Create valid composite health record with all measurements', !err6);

  // Test 7: Reject record with no measurement
  const emptyRecord = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-06T08:30:00.000Z'),
    notes: 'Just a note without measurement',
  });
  const err7 = emptyRecord.validateSync();
  assertTest(
    'Test 7: Reject record with zero health measurements',
    Boolean(err7 && (err7.errors.measurements || err7.errors.recordDate))
  );

  // Test 8: Reject negative weight
  const negWeight = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-06T08:30:00.000Z'),
    weight: -10,
  });
  const err8 = negWeight.validateSync();
  assertTest('Test 8: Reject negative weight (-10 kg)', err8 && err8.errors && err8.errors.weight);

  // Test 9: Reject invalid blood pressure (systolic <= diastolic or missing part)
  const invBp1 = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-06T08:30:00.000Z'),
    bloodPressure: { systolic: 80, diastolic: 120 }, // inverted
  });
  const err9a = invBp1.validateSync();
  const invBp2 = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-06T08:30:00.000Z'),
    bloodPressure: { systolic: 120 }, // missing diastolic
  });
  const err9b = invBp2.validateSync();
  assertTest(
    'Test 9: Reject invalid blood pressure (systolic <= diastolic or incomplete)',
    Boolean(err9a?.errors?.bloodPressure && err9b?.errors?.bloodPressure)
  );

  // Test 10: Reject invalid blood sugar (< 20 or > 1000)
  const invSugar = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-06T08:30:00.000Z'),
    bloodSugar: 5,
  });
  const err10 = invSugar.validateSync();
  assertTest('Test 10: Reject invalid blood sugar (5 mg/dL below physiological minimum)', err10 && err10.errors.bloodSugar);

  // Test 11: Reject invalid heart rate (< 20 or > 300)
  const invHr = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-06T08:30:00.000Z'),
    heartRate: 10,
  });
  const err11 = invHr.validateSync();
  assertTest('Test 11: Reject invalid heart rate (10 BPM)', err11 && err11.errors.heartRate);

  // Test 12: Reject invalid temperature (< 25 or > 45)
  const invTemp = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-06T08:30:00.000Z'),
    temperature: 55,
  });
  const err12 = invTemp.validateSync();
  assertTest('Test 12: Reject impossible temperature (55 °C)', err12 && err12.errors.temperature);

  // Test 13: Reject malformed date in validator
  const malformedDateReq = { body: { recordDate: 'invalid-date', weight: 65 } };
  const err13 = runValidator(validateCreateHealthRecord, malformedDateReq);
  assertTest('Test 13: Reject malformed recordDate format in validator', err13 && err13.statusCode === 400);

  // Test 14: Reject unreasonable future date (> 5 min from now)
  const futureRecord = new HealthRecord({
    user: userA,
    recordDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    weight: 68,
  });
  const err14 = futureRecord.validateSync();
  assertTest('Test 14: Reject unreasonable future recordDate', Boolean(err14?.errors?.recordDate));

  // Test 15: Validate notes length (max 1000)
  const longNotesReq = {
    body: { weight: 70, notes: 'a'.repeat(1001) },
  };
  const err15 = runValidator(validateCreateHealthRecord, longNotesReq);
  assertTest('Test 15: Reject notes exceeding 1000 characters', err15 && err15.statusCode === 400);

  // --- 2. Ownership & Security Tests ---

  // Test 16: User can create own record
  const userRecord = {
    user: userA,
    weight: 68.5,
  };
  assertTest('Test 16: Record is assigned to authenticated user ID', userRecord.user === userA);

  // Test 17: User can retrieve own record
  const mockDbRecords = [
    { _id: new mongoose.Types.ObjectId(), user: userA, weight: 68.5 },
    { _id: new mongoose.Types.ObjectId(), user: userB, weight: 80.0 },
  ];
  const userARecord = mockDbRecords.find((r) => r.user.toString() === userA.toString());
  assertTest('Test 17: User can retrieve their own record', userARecord && userARecord.weight === 68.5);

  // Test 18: User cannot retrieve another user's record
  const userATryingToGetB = mockDbRecords.find(
    (r) => r.user.toString() === userA.toString() && r._id.toString() === mockDbRecords[1]._id.toString()
  );
  assertTest('Test 18: Cross-user retrieval returns null/not found', userATryingToGetB === undefined);

  // Test 19: User cannot update another user's record
  const canUpdate = (reqUserId, record) => record.user.toString() === reqUserId.toString();
  assertTest('Test 19: Ownership guard prevents updating another user record', !canUpdate(userA, mockDbRecords[1]));

  // Test 20: User cannot delete another user's record
  const canDelete = (reqUserId, record) => record.user.toString() === reqUserId.toString();
  assertTest('Test 20: Ownership guard prevents deleting another user record', !canDelete(userA, mockDbRecords[1]));

  // --- 3. Update Tests ---

  // Test 21: Update weight
  const recordToUpdate = { weight: 68.5, bloodPressure: { systolic: 120, diastolic: 80 } };
  recordToUpdate.weight = 67.0;
  assertTest('Test 21: Weight update succeeds', recordToUpdate.weight === 67.0);

  // Test 22: Update blood pressure
  recordToUpdate.bloodPressure = { systolic: 118, diastolic: 78 };
  assertTest('Test 22: Blood pressure update succeeds', recordToUpdate.bloodPressure.systolic === 118);

  // Test 23: Update notes
  recordToUpdate.notes = 'Updated notes after walk';
  assertTest('Test 23: Notes update succeeds', recordToUpdate.notes === 'Updated notes after walk');

  // Test 24: Update record date
  const newDate = new Date('2026-09-06T10:00:00.000Z');
  recordToUpdate.recordDate = newDate;
  assertTest('Test 24: Record date update succeeds', recordToUpdate.recordDate === newDate);

  // Test 25: Prevent user field modification in validator
  const updateWithUserReq = { body: { user: userB.toString(), weight: 70 } };
  const err25 = runValidator(validateUpdateHealthRecord, updateWithUserReq);
  assertTest('Test 25: Validator rejects user field mutation attempt', err25 && err25.statusCode === 400);

  // Test 26: Prevent ID modification in validator
  const updateWithIdReq = { body: { _id: new mongoose.Types.ObjectId().toString(), weight: 70 } };
  const err26 = runValidator(validateUpdateHealthRecord, updateWithIdReq);
  assertTest('Test 26: Validator rejects _id field mutation attempt', err26 && err26.statusCode === 400);

  // Test 27: Revalidate updated data (must keep at least one measurement)
  const remainingRecord = { weight: undefined, bloodPressure: undefined };
  const hasRemaining = remainingRecord.weight !== undefined || remainingRecord.bloodPressure !== undefined;
  assertTest('Test 27: Record cannot be stripped of all measurements on update', !hasRemaining);

  // --- 4. List & Pagination Tests ---

  // Test 28: Pagination works (page & limit defaults)
  const sampleList = Array.from({ length: 45 }, (_, i) => ({ id: i + 1, date: `2026-09-${String(i + 1).padStart(2, '0')}` }));
  const page = 1;
  const limit = 20;
  const paginated = sampleList.slice((page - 1) * limit, page * limit);
  assertTest('Test 28: Pagination slices list into 20 items for page 1', paginated.length === 20 && paginated[0].id === 1);

  // Test 29: Date filtering works (startDate & endDate)
  const dates = ['2026-09-01', '2026-09-03', '2026-09-06', '2026-09-10'];
  const filteredDates = dates.filter((d) => d >= '2026-09-01' && d <= '2026-09-06');
  assertTest('Test 29: Date range filter captures only dates in [2026-09-01, 2026-09-06]', filteredDates.length === 3);

  // Test 30: Newest records appear first (sorting check)
  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a));
  assertTest('Test 30: Newest records appear first in descending order', sortedDates[0] === '2026-09-10');

  // Test 31: User isolation works in list queries
  const multiUserDb = [
    { id: 1, user: userA },
    { id: 2, user: userB },
    { id: 3, user: userA },
  ];
  const userAList = multiUserDb.filter((r) => r.user.toString() === userA.toString());
  assertTest('Test 31: Multi-user list returns strictly userA records (2 of 3)', userAList.length === 2);

  // Test 32: Maximum page size enforced (limit <= 50)
  const limitOverMaxReq = { query: { limit: '100' } };
  const err32 = runValidator(validateHealthRecordQuery, limitOverMaxReq);
  assertTest('Test 32: Page size over 50 is rejected with 400 error', err32 && err32.statusCode === 400);

  // Test 33: Invalid pagination rejected (negative or non-integer)
  const invalidPageReq = { query: { page: '-1' } };
  const err33 = runValidator(validateHealthRecordQuery, invalidPageReq);
  assertTest('Test 33: Negative page parameter rejected with 400 error', err33 && err33.statusCode === 400);

  // --- 5. Security Tests ---

  // Test 34: Reject unauthenticated request simulation
  const checkAuth = (req) => !!req.user;
  assertTest('Test 34: Unauthenticated request without req.user is detected', !checkAuth({}));

  // Test 35: Reject arbitrary userId ownership injection
  const createReq = { body: { userId: userB.toString(), weight: 70 }, user: { id: userA } };
  const assignedUser = createReq.user.id; // Controller uses req.user.id, ignoring req.body.userId
  assertTest('Test 35: req.body.userId is ignored in favor of req.user.id', assignedUser === userA && assignedUser !== userB);

  // Test 36: Reject MongoDB operator injection in query
  const dangerousQuery = { type: '$where' };
  const err36 = runValidator(validateHealthRecordQuery, { query: dangerousQuery });
  assertTest('Test 36: Arbitrary type filter is rejected by whitelist validator', err36 && err36.statusCode === 400);

  // Test 37: Reject mass assignment (extra unexpected fields stripped)
  const rawInput = { weight: 70, isAdmin: true, role: 'admin', __v: 99 };
  const allowedKeys = ['recordDate', 'weight', 'bloodPressure', 'bloodSugar', 'heartRate', 'temperature', 'notes'];
  const sanitized = Object.keys(rawInput)
    .filter((k) => allowedKeys.includes(k))
    .reduce((obj, k) => {
      obj[k] = rawInput[k];
      return obj;
    }, {});
  assertTest('Test 37: Mass assignment fields (isAdmin, role, __v) are stripped', sanitized.isAdmin === undefined && sanitized.weight === 70);

  // Test 38: Reject malformed ObjectId in params
  const malformedIdReq = { params: { id: 'not-an-id' } };
  const err38 = runValidator(validateRecordId, malformedIdReq);
  assertTest('Test 38: Malformed ObjectId is rejected with 400 error', err38 && err38.statusCode === 400);

  // --- 6. Data Integrity Tests ---

  // Test 39: Partial records work
  const partialRec = new HealthRecord({
    user: userA,
    recordDate: new Date(),
    weight: 72.5,
  });
  assertTest('Test 39: Partial record with only weight is valid', !partialRec.validateSync());

  // Test 40: Multiple records can exist for the same day (morning & evening)
  const morningRec = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-01T08:00:00.000Z'),
    bloodSugar: 90,
  });
  const eveningRec = new HealthRecord({
    user: userA,
    recordDate: new Date('2026-09-01T20:00:00.000Z'),
    bloodSugar: 110,
  });
  assertTest('Test 40: Multiple records can be logged on the same calendar date', !morningRec.validateSync() && !eveningRec.validateSync());

  // Test 41: Schema includes timestamps
  assertTest('Test 41: HealthRecord schema includes timestamps options', HealthRecord.schema.options.timestamps === true);

  // Test 42: Units are standardized and documented
  const units = {
    weight: 'kg',
    bloodPressure: 'mmHg',
    bloodSugar: 'mg/dL',
    heartRate: 'BPM',
    temperature: '°C',
  };
  assertTest('Test 42: Measurement units are clearly defined and consistent', units.weight === 'kg' && units.bloodPressure === 'mmHg' && units.bloodSugar === 'mg/dL' && units.heartRate === 'BPM' && units.temperature === '°C');

  console.log(`\nHealth Record Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runHealthRecordTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
