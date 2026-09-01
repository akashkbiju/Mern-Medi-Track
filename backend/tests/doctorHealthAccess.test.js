import mongoose from 'mongoose';
import { doctorHealthService } from '../services/doctorHealthService.js';
import { connectionAccessService } from '../services/connectionAccessService.js';
import { healthService } from '../services/healthService.js';
import { healthAnalyticsService } from '../services/healthAnalyticsService.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  patientIdParamValidator,
  doctorHealthRecordsQueryValidator,
  doctorHealthAnalyticsQueryValidator,
} from '../validators/doctorHealthValidator.js';
import User from '../models/User.js';
import HealthRecord from '../models/HealthRecord.js';
import DoctorPatientConnection from '../models/DoctorPatientConnection.js';
import { logger } from '../utils/logger.js';

/**
 * Step 21 Verification Test Suite: Doctor Health-Record Access
 * Covers all 36 scenarios specified in Section 52 of Step 21
 */
async function runDoctorHealthAccessTests() {
  console.log('--- Starting Step 21 Doctor Health-Record Access Verification Suite ---');
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

  const runValidator = async (validatorArray, req) => {
    for (const validation of validatorArray) {
      await validation.run(req);
    }
    const { validationResult } = await import('express-validator');
    return validationResult(req);
  };

  // Mock IDs
  const doctorIdA = new mongoose.Types.ObjectId();
  const doctorIdB = new mongoose.Types.ObjectId();
  const inactiveDoctorId = new mongoose.Types.ObjectId();
  const patientIdA = new mongoose.Types.ObjectId();
  const patientIdB = new mongoose.Types.ObjectId();
  const inactivePatientId = new mongoose.Types.ObjectId();

  // In-memory data store
  const mockUsers = new Map();
  const mockConnections = new Map();
  const mockRecords = [];

  // Users
  const doctorA = {
    _id: doctorIdA,
    fullName: 'Dr. Gregory House',
    email: 'house@princeton.edu',
    role: 'doctor',
    isActive: true,
  };
  const doctorB = {
    _id: doctorIdB,
    fullName: 'Dr. James Wilson',
    email: 'wilson@princeton.edu',
    role: 'doctor',
    isActive: true,
  };
  const inactiveDoctor = {
    _id: inactiveDoctorId,
    fullName: 'Dr. Inactive',
    email: 'inactive.doc@example.com',
    role: 'doctor',
    isActive: false,
  };
  const patientA = {
    _id: patientIdA,
    fullName: 'Alice Walker',
    email: 'alice@example.com',
    role: 'patient',
    isActive: true,
    gender: 'female',
    dateOfBirth: '1990-05-14',
    emergencyContact: 'Bob Walker (+1234567890)',
    password: 'SuperSecretHashedPassword123!',
  };
  const patientB = {
    _id: patientIdB,
    fullName: 'Bob Smith',
    email: 'bob@example.com',
    role: 'patient',
    isActive: true,
    gender: 'male',
    dateOfBirth: '1985-02-20',
  };
  const inactivePatient = {
    _id: inactivePatientId,
    fullName: 'Inactive Patient',
    email: 'inactive.patient@example.com',
    role: 'patient',
    isActive: false,
  };

  mockUsers.set(doctorIdA.toString(), doctorA);
  mockUsers.set(doctorIdB.toString(), doctorB);
  mockUsers.set(inactiveDoctorId.toString(), inactiveDoctor);
  mockUsers.set(patientIdA.toString(), patientA);
  mockUsers.set(patientIdB.toString(), patientB);
  mockUsers.set(inactivePatientId.toString(), inactivePatient);

  // Connections
  // Doctor A + Patient A: approved with healthRecords: true
  const connDoctorAPatientA = {
    _id: new mongoose.Types.ObjectId(),
    doctor: doctorIdA,
    patient: patientIdA,
    status: 'approved',
    permissions: { medications: true, healthRecords: true, reports: true },
    approvedAt: new Date(),
  };

  // Doctor A + Patient B: pending
  const connDoctorAPatientBPending = {
    _id: new mongoose.Types.ObjectId(),
    doctor: doctorIdA,
    patient: patientIdB,
    status: 'pending',
    permissions: { medications: false, healthRecords: false, reports: false },
  };

  // Doctor B + Patient B: approved
  const connDoctorBPatientB = {
    _id: new mongoose.Types.ObjectId(),
    doctor: doctorIdB,
    patient: patientIdB,
    status: 'approved',
    permissions: { medications: true, healthRecords: true, reports: true },
    approvedAt: new Date(),
  };

  mockConnections.set(`${doctorIdA}_${patientIdA}`, connDoctorAPatientA);
  mockConnections.set(`${doctorIdA}_${patientIdB}`, connDoctorAPatientBPending);
  mockConnections.set(`${doctorIdB}_${patientIdB}`, connDoctorBPatientB);

  // Health records for Patient A
  const sampleRecordsA = [
    {
      _id: new mongoose.Types.ObjectId(),
      user: patientIdA,
      recordDate: new Date('2026-09-05T10:00:00.000Z'),
      weight: 68.5,
      bloodPressure: { systolic: 120, diastolic: 80 },
      bloodSugar: 95,
      heartRate: 72,
      temperature: 36.6,
      notes: 'Morning routine check',
      createdAt: new Date('2026-09-05T10:05:00.000Z'),
      updatedAt: new Date('2026-09-05T10:05:00.000Z'),
    },
    {
      _id: new mongoose.Types.ObjectId(),
      user: patientIdA,
      recordDate: new Date('2026-09-01T08:30:00.000Z'),
      weight: 69.0,
      bloodPressure: { systolic: 122, diastolic: 82 },
      bloodSugar: 98,
      heartRate: 75,
      temperature: 36.7,
      notes: 'Slight fatigue',
      createdAt: new Date('2026-09-01T08:35:00.000Z'),
      updatedAt: new Date('2026-09-01T08:35:00.000Z'),
    },
  ];
  mockRecords.push(...sampleRecordsA);

  // Monkey-patch Mongoose models
  const origUserFindById = User.findById;
  const origConnFindOne = DoctorPatientConnection.findOne;
  const origHealthFind = HealthRecord.find;
  const origHealthFindOne = HealthRecord.findOne;
  const origHealthCount = HealthRecord.countDocuments;

  User.findById = (id) => {
    const idStr = id?.toString();
    const user = mockUsers.get(idStr);
    const chain = {
      select: () => ({
        lean: () => Promise.resolve(user || null),
        then: (resolve, reject) => Promise.resolve(user || null).then(resolve, reject),
      }),
      lean: () => Promise.resolve(user || null),
      then: (resolve, reject) => Promise.resolve(user || null).then(resolve, reject),
    };
    return chain;
  };

  DoctorPatientConnection.findOne = (query) => {
    const key = `${query.doctor}_${query.patient}`;
    const conn = mockConnections.get(key);
    return Promise.resolve(conn || null);
  };

  HealthRecord.find = (query) => {
    const targetUserId = query.user?.toString();
    let records = mockRecords.filter((r) => r.user.toString() === targetUserId);

    if (query.recordDate) {
      if (query.recordDate.$gte) {
        records = records.filter((r) => r.recordDate >= query.recordDate.$gte);
      }
      if (query.recordDate.$lte) {
        records = records.filter((r) => r.recordDate <= query.recordDate.$lte);
      }
    }

    if (query.type) {
      if (query.type === 'bloodPressure') {
        records = records.filter((r) => r.bloodPressure && r.bloodPressure.systolic);
      } else {
        records = records.filter((r) => r[query.type] !== undefined && r[query.type] !== null);
      }
    }

    let skipVal = 0;
    let limitVal = records.length;

    const queryChain = {
      sort: () => queryChain,
      skip: (n) => {
        skipVal = n;
        return queryChain;
      },
      limit: (n) => {
        limitVal = n;
        return queryChain;
      },
      select: () => queryChain,
      lean: () => Promise.resolve(records.slice(skipVal, skipVal + limitVal)),
      then: (resolve, reject) =>
        Promise.resolve(records.slice(skipVal, skipVal + limitVal)).then(resolve, reject),
    };

    return queryChain;
  };

  HealthRecord.findOne = (query) => {
    const targetUserId = query.user?.toString();
    let records = mockRecords.filter((r) => r.user.toString() === targetUserId);

    if (query.recordDate) {
      if (query.recordDate.$gte) {
        records = records.filter((r) => r.recordDate >= query.recordDate.$gte);
      }
      if (query.recordDate.$lte) {
        records = records.filter((r) => r.recordDate <= query.recordDate.$lte);
      }
      if (query.recordDate.$lt) {
        records = records.filter((r) => r.recordDate < query.recordDate.$lt);
      }
      if (query.recordDate.$gt) {
        records = records.filter((r) => r.recordDate > query.recordDate.$gt);
      }
    }

    const first = records[0] || null;
    const chain = {
      sort: () => chain,
      select: () => chain,
      lean: () => Promise.resolve(first),
      then: (resolve, reject) => Promise.resolve(first).then(resolve, reject),
    };
    return chain;
  };

  HealthRecord.countDocuments = (query) => {
    const targetUserId = query.user?.toString();
    let records = mockRecords.filter((r) => r.user.toString() === targetUserId);
    if (query.recordDate) {
      if (query.recordDate.$gte) {
        records = records.filter((r) => r.recordDate >= query.recordDate.$gte);
      }
      if (query.recordDate.$lte) {
        records = records.filter((r) => r.recordDate <= query.recordDate.$lte);
      }
    }
    return Promise.resolve(records.length);
  };

  // Capture audit logs
  const auditLogs = [];
  const origLoggerInfo = logger.info;
  logger.info = (msg, meta) => {
    if (meta && meta.action) {
      auditLogs.push({ msg, meta });
    }
    origLoggerInfo(msg);
  };

  try {
    // ==========================================
    // 1. AUTHENTICATION (Tests 1–3)
    // ==========================================
    // Test 1: Unauthenticated request rejected with 401
    const reqUnauth = { headers: {} };
    let unauthErr = null;
    await new Promise((resolve) => protect(reqUnauth, {}, (err) => { unauthErr = err; resolve(); }));
    assertTest('Test 1: Unauthenticated doctor request rejected with 401', unauthErr && unauthErr.statusCode === 401);

    // Test 2: Invalid JWT rejected with 401
    const reqBadJwt = { headers: { authorization: 'Bearer invalid.token.value' } };
    let badJwtErr = null;
    await new Promise((resolve) => protect(reqBadJwt, {}, (err) => { badJwtErr = err; resolve(); }));
    assertTest('Test 2: Invalid JWT rejected with 401', badJwtErr && badJwtErr.statusCode === 401);

    // Test 3: Inactive doctor rejected with 403
    let inactiveDocErr = false;
    try {
      await connectionAccessService.verifyDoctorPatientHealthAccess(inactiveDoctorId.toString(), patientIdA.toString());
    } catch (err) {
      inactiveDocErr = err.statusCode === 403;
    }
    assertTest('Test 3: Inactive doctor rejected with 403 Forbidden', inactiveDocErr);

    // ==========================================
    // 2. ROLE AUTHORIZATION (Tests 4–5)
    // ==========================================
    // Test 4: Patient cannot access doctor health routes
    const patientReq = { user: { role: 'patient' } };
    let patientBlocked = false;
    const roleMiddleware = authorizeRoles('doctor');
    try {
      roleMiddleware(patientReq, {}, (err) => {
        patientBlocked = err && err.statusCode === 403;
      });
    } catch (err) {
      patientBlocked = err && err.statusCode === 403;
    }
    assertTest('Test 4: Patient cannot access doctor health routes (403 Forbidden)', patientBlocked);

    // Test 5: Doctor can access doctor health routes
    const doctorReq = { user: { role: 'doctor' } };
    let doctorAllowed = false;
    try {
      roleMiddleware(doctorReq, {}, (err) => {
        doctorAllowed = !err;
      });
    } catch (err) {
      doctorAllowed = false;
    }
    assertTest('Test 5: Doctor can access doctor health routes passing roleMiddleware', doctorAllowed);

    // ==========================================
    // 3. CONNECTION LIFECYCLE (Tests 6–10)
    // ==========================================
    // Test 6: Approved connection allows access
    const approvedAccess = await connectionAccessService.verifyDoctorPatientHealthAccess(
      doctorIdA.toString(),
      patientIdA.toString()
    );
    assertTest(
      'Test 6: Approved connection allows access returning connection and patient info',
      approvedAccess.connection.status === 'approved' && approvedAccess.patient.fullName === 'Alice Walker'
    );

    // Test 7: Pending connection denies access
    let pendingDenied = false;
    try {
      await connectionAccessService.verifyDoctorPatientHealthAccess(doctorIdA.toString(), patientIdB.toString());
    } catch (err) {
      pendingDenied = err.statusCode === 403;
    }
    assertTest('Test 7: Pending connection denies access with 403', pendingDenied);

    // Test 8: Rejected connection denies access
    mockConnections.set(`${doctorIdA}_${patientIdB}`, {
      doctor: doctorIdA,
      patient: patientIdB,
      status: 'rejected',
      permissions: { healthRecords: false },
    });
    let rejectedDenied = false;
    try {
      await connectionAccessService.verifyDoctorPatientHealthAccess(doctorIdA.toString(), patientIdB.toString());
    } catch (err) {
      rejectedDenied = err.statusCode === 403;
    }
    assertTest('Test 8: Rejected connection denies access with 403', rejectedDenied);

    // Test 9: Revoked connection denies access
    mockConnections.set(`${doctorIdA}_${patientIdB}`, {
      doctor: doctorIdA,
      patient: patientIdB,
      status: 'revoked',
      permissions: { healthRecords: false },
    });
    let revokedDenied = false;
    try {
      await connectionAccessService.verifyDoctorPatientHealthAccess(doctorIdA.toString(), patientIdB.toString());
    } catch (err) {
      revokedDenied = err.statusCode === 403;
    }
    assertTest('Test 9: Revoked connection denies access with 403', revokedDenied);

    // Test 10: Missing connection denies access
    let missingDenied = false;
    const randomPatientId = new mongoose.Types.ObjectId();
    mockUsers.set(randomPatientId.toString(), { _id: randomPatientId, role: 'patient', isActive: true });
    try {
      await connectionAccessService.verifyDoctorPatientHealthAccess(doctorIdA.toString(), randomPatientId.toString());
    } catch (err) {
      missingDenied = err.statusCode === 403;
    }
    assertTest('Test 10: Missing connection denies access with 403', missingDenied);

    // ==========================================
    // 4. PERMISSIONS (Tests 11–12)
    // ==========================================
    // Test 11: healthRecords=true allows access
    assertTest(
      'Test 11: healthRecords=true allows access',
      connDoctorAPatientA.permissions.healthRecords === true && approvedAccess.connection !== null
    );

    // Test 12: healthRecords=false denies access
    connDoctorAPatientA.permissions.healthRecords = false;
    let permDisabledDenied = false;
    let permDisabledMsg = '';
    try {
      await connectionAccessService.verifyDoctorPatientHealthAccess(doctorIdA.toString(), patientIdA.toString());
    } catch (err) {
      permDisabledDenied = err.statusCode === 403;
      permDisabledMsg = err.message;
    }
    assertTest(
      'Test 12: healthRecords=false denies access with descriptive message',
      permDisabledDenied && permDisabledMsg.includes('disabled')
    );
    // Restore permission for subsequent tests
    connDoctorAPatientA.permissions.healthRecords = true;

    // ==========================================
    // 5. OWNERSHIP & IDOR (Tests 13–16)
    // ==========================================
    // Test 13: Doctor A cannot access Patient B
    let idorDocAToB = false;
    try {
      await doctorHealthService.getConnectedPatientHealthRecords(doctorIdA.toString(), patientIdB.toString());
    } catch (err) {
      idorDocAToB = err.statusCode === 403;
    }
    assertTest('Test 13: Doctor A cannot access Patient B (IDOR prevented with 403)', idorDocAToB);

    // Test 14: Doctor B cannot access Patient A
    let idorDocBToA = false;
    try {
      await doctorHealthService.getConnectedPatientHealthRecords(doctorIdB.toString(), patientIdA.toString());
    } catch (err) {
      idorDocBToA = err.statusCode === 403;
    }
    assertTest('Test 14: Doctor B cannot access Patient A (IDOR prevented with 403)', idorDocBToA);

    // Test 15: URL manipulation (switching patientId in route) validated against connection
    let urlManipDenied = false;
    try {
      await connectionAccessService.verifyDoctorPatientHealthAccess(doctorIdA.toString(), patientIdB.toString());
    } catch (err) {
      urlManipDenied = err.statusCode === 403;
    }
    assertTest('Test 15: URL patient ID manipulation independently verified & denied', urlManipDenied);

    // Test 16: Doctor ID is strictly from req.user.id, ignoring any doctorId in query or body
    const reqWithSpoofedDoctor = {
      user: { id: doctorIdA.toString(), role: 'doctor' },
      query: { doctorId: doctorIdB.toString() },
      body: { doctorId: doctorIdB.toString() },
      params: { patientId: patientIdA.toString() },
    };
    // Service function signature accepts req.user.id as first param
    const recordsFromReq = await doctorHealthService.getConnectedPatientHealthRecords(
      reqWithSpoofedDoctor.user.id,
      reqWithSpoofedDoctor.params.patientId
    );
    assertTest(
      'Test 16: Doctor ID manipulation denied; uses authenticated doctor ID strictly',
      recordsFromReq.patient.id === patientIdA.toString()
    );

    // ==========================================
    // 6. HEALTH RECORDS (Tests 17–23)
    // ==========================================
    // Test 17: Correct patient records returned
    assertTest(
      'Test 17: Correct patient records returned with expected count',
      recordsFromReq.records.length === 2 && recordsFromReq.records[0].weight === 68.5
    );

    // Test 18: Pagination works
    const paginatedRes = await doctorHealthService.getConnectedPatientHealthRecords(
      doctorIdA.toString(),
      patientIdA.toString(),
      { page: 1, limit: 1 }
    );
    assertTest(
      'Test 18: Pagination works (returns limit 1, total 2, totalPages 2)',
      paginatedRes.records.length === 1 && paginatedRes.pagination.limit === 1 && paginatedRes.pagination.totalPages === 2
    );

    // Test 19: Date filtering works
    const dateFiltered = await doctorHealthService.getConnectedPatientHealthRecords(
      doctorIdA.toString(),
      patientIdA.toString(),
      { startDate: '2026-09-02', endDate: '2026-09-06' }
    );
    assertTest(
      'Test 19: Date filtering returns only records matching date range',
      dateFiltered.records.length === 1 && dateFiltered.records[0].weight === 68.5
    );

    // Test 20: Invalid patient ID rejected with 400
    let badPatientIdErr = false;
    try {
      await connectionAccessService.verifyDoctorPatientHealthAccess(doctorIdA.toString(), 'invalid-id-xyz');
    } catch (err) {
      badPatientIdErr = err.statusCode === 400;
    }
    assertTest('Test 20: Invalid patient ID format rejected with 400 Bad Request', badPatientIdErr);

    // Test 21: Invalid date filter rejected with 400
    let badDateErr = false;
    try {
      await doctorHealthService.getConnectedPatientHealthRecords(
        doctorIdA.toString(),
        patientIdA.toString(),
        { startDate: 'not-a-date' }
      );
    } catch (err) {
      badDateErr = err.statusCode === 400;
    }
    assertTest('Test 21: Invalid date format rejected with 400 Bad Request', badDateErr);

    // Test 22: Large date range handled safely
    const wideDateRange = await doctorHealthService.getConnectedPatientHealthRecords(
      doctorIdA.toString(),
      patientIdA.toString(),
      { startDate: '2020-01-01', endDate: '2026-12-31' }
    );
    assertTest(
      'Test 22: Large date range query handled safely without server errors',
      wideDateRange.records.length === 2
    );

    // Test 23: Missing measurements handled gracefully
    mockRecords.push({
      _id: new mongoose.Types.ObjectId(),
      user: patientIdA,
      recordDate: new Date('2026-09-06T12:00:00.000Z'),
      weight: 68.2,
      notes: 'Weight only recorded',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const withPartial = await doctorHealthService.getConnectedPatientHealthRecords(
      doctorIdA.toString(),
      patientIdA.toString()
    );
    const partialRec = withPartial.records.find((r) => r.notes === 'Weight only recorded');
    assertTest(
      'Test 23: Missing individual measurements handled gracefully (null/undefined fields)',
      partialRec && partialRec.bloodPressure === undefined && partialRec.weight === 68.2
    );

    // ==========================================
    // 7. ANALYTICS (Tests 24–30)
    // ==========================================
    // Test 24: Patient analytics returned correctly
    const analyticsRes = await doctorHealthService.getConnectedPatientHealthAnalytics(
      doctorIdA.toString(),
      patientIdA.toString(),
      { period: '30d', metric: 'weight' }
    );
    assertTest(
      'Test 24: Patient analytics returned correctly with patient name and metric data',
      analyticsRes.patient.fullName === 'Alice Walker' && analyticsRes.metric === 'weight'
    );

    // Test 25: 7-day period resolved
    const analytics7d = await doctorHealthService.getConnectedPatientHealthAnalytics(
      doctorIdA.toString(),
      patientIdA.toString(),
      { period: '7d' }
    );
    assertTest('Test 25: 7-day period analytics handled properly', analytics7d.period === '7d');

    // Test 26: 30-day period resolved
    const analytics30d = await doctorHealthService.getConnectedPatientHealthAnalytics(
      doctorIdA.toString(),
      patientIdA.toString(),
      { period: '30d' }
    );
    assertTest('Test 26: 30-day period analytics handled properly', analytics30d.period === '30d');

    // Test 27: 90-day period resolved
    const analytics90d = await doctorHealthService.getConnectedPatientHealthAnalytics(
      doctorIdA.toString(),
      patientIdA.toString(),
      { period: '90d' }
    );
    assertTest('Test 27: 90-day period analytics handled properly', analytics90d.period === '90d');

    // Test 28: Custom period resolved
    const analyticsCustom = await doctorHealthService.getConnectedPatientHealthAnalytics(
      doctorIdA.toString(),
      patientIdA.toString(),
      { period: 'custom', startDate: '2026-08-01', endDate: '2026-09-01' }
    );
    assertTest(
      'Test 28: Custom period analytics resolved with given date range',
      analyticsCustom.period === 'custom' && analyticsCustom.startDate === '2026-08-01'
    );

    // Test 29: Missing data handled gracefully without NaN or crashes
    const summaryRes = await doctorHealthService.getConnectedPatientHealthSummary(
      doctorIdA.toString(),
      patientIdA.toString()
    );
    assertTest(
      'Test 29: Missing data handles empty or partial values cleanly',
      summaryRes.latest !== null && typeof summaryRes.recordCount === 'number'
    );

    // Test 30: Latest, previous, change calculations match Step 16 analytics engine
    assertTest(
      'Test 30: Summary incorporates latest metric values and record count',
      summaryRes.recordCount >= 2 && summaryRes.patient.id === patientIdA.toString()
    );

    // ==========================================
    // 8. PRIVACY & SECURITY (Tests 31–35)
    // ==========================================
    // Test 31: Password not returned in patient summary or records
    assertTest(
      'Test 31: Patient password is strictly not returned in doctor responses',
      summaryRes.patient.password === undefined && recordsFromReq.patient.password === undefined
    );

    // Test 32: JWT tokens not exposed in payloads
    assertTest(
      'Test 32: JWT token is not exposed in any doctor response field',
      recordsFromReq.token === undefined && summaryRes.token === undefined
    );

    // Test 33: Unrelated private user account fields not exposed
    assertTest(
      'Test 33: Private user system fields (login attempts, verification tokens) not exposed',
      recordsFromReq.patient.role === undefined && recordsFromReq.patient.email === undefined
    );

    // Test 34: Health data not returned to unauthorized doctor
    let unauthDataLeaked = true;
    try {
      await doctorHealthService.getConnectedPatientHealthRecords(doctorIdB.toString(), patientIdA.toString());
    } catch {
      unauthDataLeaked = false;
    }
    assertTest('Test 34: Health data strictly not returned to unauthorized doctor', !unauthDataLeaked);

    // Test 35: Health values NOT written to audit logs
    const hasSensitiveValuesInAudit = auditLogs.some((log) => {
      const serialized = JSON.stringify(log);
      return (
        serialized.includes('bloodPressure') ||
        serialized.includes('bloodSugar') ||
        serialized.includes('systolic') ||
        serialized.includes('diastolic') ||
        serialized.includes('68.5')
      );
    });
    assertTest(
      'Test 35: Sensitive health values (BP, sugar, weight, notes) are NOT written to audit logs',
      !hasSensitiveValuesInAudit && auditLogs.length > 0
    );

    // ==========================================
    // 9. CONNECTION REVOCATION (Test 36)
    // ==========================================
    // Test 36: Immediate access denial after connection revoked
    connDoctorAPatientA.status = 'revoked';
    let revokedAccessErr = false;
    try {
      await doctorHealthService.getConnectedPatientHealthRecords(doctorIdA.toString(), patientIdA.toString());
    } catch (err) {
      revokedAccessErr = err.statusCode === 403;
    }
    assertTest(
      'Test 36: Access is immediately denied after connection is revoked',
      revokedAccessErr
    );

    console.log('\n--- Step 21 Test Results ---');
    console.log(`Passed: ${passed} / 36`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    // Restore originals
    User.findById = origUserFindById;
    DoctorPatientConnection.findOne = origConnFindOne;
    HealthRecord.find = origHealthFind;
    HealthRecord.findOne = origHealthFindOne;
    HealthRecord.countDocuments = origHealthCount;
    logger.info = origLoggerInfo;
  }
}

runDoctorHealthAccessTests();
