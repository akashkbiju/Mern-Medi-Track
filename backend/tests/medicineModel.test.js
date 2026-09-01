import mongoose from 'mongoose';
import Medicine from '../models/Medicine.js';
import {
  validateSchedule,
  validateDateRange,
  normalizeMedicineData,
  validateMedicineData,
} from '../services/medicineService.js';

/**
 * Test Runner for Step 8: Medicine Database Model & Validation
 * Verifies all 15 requirements from Step 8 Section 27
 */
async function runMedicineModelTests() {
  console.log('--- Starting Step 8 Medicine Model Verification Suite ---');
  let passed = 0;
  let failed = 0;

  const validUserId = new mongoose.Types.ObjectId();

  const validMedicineData = {
    user: validUserId,
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    dosage: 500,
    dosageUnit: 'mg',
    frequency: 'twice_daily',
    times: ['08:00', '20:00'],
    startDate: new Date('2026-09-06'),
    endDate: new Date('2026-09-20'),
    instructions: 'Take after meals with a glass of water',
    notes: 'Prescribed for mild fever and headache',
    isActive: true,
  };

  const assertTest = (description, condition) => {
    if (condition) {
      console.log(`✓ PASSED: ${description}`);
      passed++;
    } else {
      console.error(`✗ FAILED: ${description}`);
      failed++;
    }
  };

  // Test 1: Medicine with all required valid fields -> succeeds
  try {
    const doc = new Medicine(validMedicineData);
    const err = doc.validateSync();
    assertTest('Test 1: Valid medicine passes schema validation', !err);
  } catch (e) {
    assertTest('Test 1: Valid medicine passes schema validation', false);
  }

  // Test 2: Missing name -> rejected
  try {
    const doc = new Medicine({ ...validMedicineData, name: '' });
    const err = doc.validateSync();
    assertTest('Test 2: Missing name is rejected', Boolean(err?.errors?.name));
  } catch (e) {
    assertTest('Test 2: Missing name is rejected', false);
  }

  // Test 3: Missing dosage -> rejected
  try {
    const doc = new Medicine({ ...validMedicineData, dosage: undefined });
    const err = doc.validateSync();
    assertTest('Test 3: Missing dosage is rejected', Boolean(err?.errors?.dosage));
  } catch (e) {
    assertTest('Test 3: Missing dosage is rejected', false);
  }

  // Test 4: Negative dosage -> rejected
  try {
    const doc = new Medicine({ ...validMedicineData, dosage: -10 });
    const err = doc.validateSync();
    assertTest('Test 4: Negative dosage is rejected', Boolean(err?.errors?.dosage));
  } catch (e) {
    assertTest('Test 4: Negative dosage is rejected', false);
  }

  // Test 5: Invalid dosage unit -> rejected
  try {
    const doc = new Medicine({ ...validMedicineData, dosageUnit: 'ounces' });
    const err = doc.validateSync();
    assertTest('Test 5: Invalid dosage unit is rejected', Boolean(err?.errors?.dosageUnit));
  } catch (e) {
    assertTest('Test 5: Invalid dosage unit is rejected', false);
  }

  // Test 6: Invalid frequency -> rejected
  try {
    const doc = new Medicine({ ...validMedicineData, frequency: 'hourly_dosage' });
    const err = doc.validateSync();
    assertTest('Test 6: Invalid frequency is rejected', Boolean(err?.errors?.frequency));
  } catch (e) {
    assertTest('Test 6: Invalid frequency is rejected', false);
  }

  // Test 7: Invalid time format -> rejected
  try {
    const doc = new Medicine({ ...validMedicineData, times: ['25:00', '08:00'] });
    const err = doc.validateSync();
    assertTest('Test 7: Invalid time format (25:00) is rejected', Boolean(err?.errors?.times));
  } catch (e) {
    assertTest('Test 7: Invalid time format (25:00) is rejected', false);
  }

  // Test 8: Duplicate times -> rejected
  try {
    const doc = new Medicine({ ...validMedicineData, times: ['08:00', '08:00'] });
    const err = doc.validateSync();
    assertTest('Test 8: Duplicate times are rejected by schema validator', Boolean(err?.errors?.times));
  } catch (e) {
    assertTest('Test 8: Duplicate times are rejected by schema validator', false);
  }

  // Test 9: Wrong number of times for frequency -> rejected by service validator
  try {
    const scheduleCheck = validateSchedule('twice_daily', ['08:00']);
    assertTest('Test 9: Wrong number of times for frequency is rejected', !scheduleCheck.valid);
  } catch (e) {
    assertTest('Test 9: Wrong number of times for frequency is rejected', false);
  }

  // Test 10: Invalid start date -> rejected
  try {
    const dateCheck = validateDateRange('invalid-date-string', null);
    assertTest('Test 10: Invalid start date is rejected', !dateCheck.valid);
  } catch (e) {
    assertTest('Test 10: Invalid start date is rejected', false);
  }

  // Test 11: End date before start date -> rejected
  try {
    const dateCheck = validateDateRange('2026-09-20', '2026-09-06');
    assertTest('Test 11: End date before start date is rejected', !dateCheck.valid);
  } catch (e) {
    assertTest('Test 11: End date before start date is rejected', false);
  }

  // Test 12: Ongoing medication with null endDate -> accepted
  try {
    const doc = new Medicine({ ...validMedicineData, endDate: null });
    const err = doc.validateSync();
    assertTest('Test 12: Ongoing medication with null endDate is accepted', !err);
  } catch (e) {
    assertTest('Test 12: Ongoing medication with null endDate is accepted', false);
  }

  // Test 13: Missing user -> rejected
  try {
    const doc = new Medicine({ ...validMedicineData, user: undefined });
    const err = doc.validateSync();
    assertTest('Test 13: Missing user is rejected', Boolean(err?.errors?.user));
  } catch (e) {
    assertTest('Test 13: Missing user is rejected', false);
  }

  // Test 14: Invalid user ObjectId -> rejected
  try {
    const doc = new Medicine({ ...validMedicineData, user: 'not-a-valid-id' });
    const err = doc.validateSync();
    assertTest('Test 14: Invalid user ObjectId is rejected', Boolean(err?.errors?.user));
  } catch (e) {
    assertTest('Test 14: Invalid user ObjectId is rejected', false);
  }

  // Test 15: Extra unauthorized fields -> safely handled
  try {
    const doc = new Medicine({
      ...validMedicineData,
      unauthorizedAdminRole: 'admin',
      $set: { hacked: true },
    });
    const obj = doc.toObject();
    assertTest(
      'Test 15: Extra unauthorized fields are not persisted in schema',
      obj.unauthorizedAdminRole === undefined && obj.$set === undefined
    );
  } catch (e) {
    assertTest('Test 15: Extra unauthorized fields are not persisted in schema', false);
  }

  // Test Normalization Helper
  const rawInput = {
    name: '   Amoxicillin   ',
    genericName: '  amoxicillin clavulanate  ',
    dosage: '250',
    dosageUnit: 'MG',
    times: ['20:00', '08:00', '20:00'],
  };
  const normalized = normalizeMedicineData(rawInput);
  assertTest(
    'Helper: Normalization trims names, sorts and deduplicates times, casts dosage',
    normalized.name === 'Amoxicillin' &&
      normalized.dosage === 250 &&
      normalized.dosageUnit === 'mg' &&
      normalized.times.length === 2 &&
      normalized.times[0] === '08:00' &&
      normalized.times[1] === '20:00'
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed > 0) {
    process.exit(1);
  }
}

runMedicineModelTests().catch((err) => {
  console.error('Unexpected error running tests:', err);
  process.exit(1);
});
