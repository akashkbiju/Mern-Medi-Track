import mongoose from 'mongoose';
import { reportService } from '../services/reportService.js';
import { adherenceService } from '../services/adherenceService.js';
import { doctorNoteService } from '../services/doctorNoteService.js';
import { notificationService } from '../services/notificationService.js';
import HealthReport from '../models/HealthReport.js';
import HealthRecord from '../models/HealthRecord.js';
import User from '../models/User.js';
import DoctorPatientConnection from '../models/DoctorPatientConnection.js';
import {
  generateReportValidator,
  reportIdParamValidator,
  reportQueryValidator,
} from '../validators/reportValidator.js';

/**
 * Step 23 Automated Verification Test Suite: Automatic Health Report Generation
 */
async function runHealthReportTests() {
  console.log('===============================================================');
  console.log('Starting Step 23 Health Report Generation Test Suite');
  console.log('===============================================================');

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
  const patientIdA = new mongoose.Types.ObjectId();
  const patientIdB = new mongoose.Types.ObjectId();
  const doctorWithPermissionId = new mongoose.Types.ObjectId();
  const doctorWithoutPermissionId = new mongoose.Types.ObjectId();
  const doctorRevokedId = new mongoose.Types.ObjectId();

  const mockUsers = new Map();
  const mockConnections = new Map();
  const mockReports = [];
  const mockNotifications = [];
  const mockHealthRecords = [];

  // Seed Users
  mockUsers.set(patientIdA.toString(), {
    _id: patientIdA,
    fullName: 'Alice Patient',
    email: 'alice.patient@test.com',
    role: 'patient',
    gender: 'female',
    dateOfBirth: new Date('1990-05-15'),
    isActive: true,
  });

  mockUsers.set(patientIdB.toString(), {
    _id: patientIdB,
    fullName: 'Bob Patient',
    email: 'bob.patient@test.com',
    role: 'patient',
    gender: 'male',
    dateOfBirth: new Date('1985-11-20'),
    isActive: true,
  });

  mockUsers.set(doctorWithPermissionId.toString(), {
    _id: doctorWithPermissionId,
    fullName: 'Dr. Evelyn Reed',
    role: 'doctor',
    isActive: true,
  });

  mockUsers.set(doctorWithoutPermissionId.toString(), {
    _id: doctorWithoutPermissionId,
    fullName: 'Dr. Victor Frank',
    role: 'doctor',
    isActive: true,
  });

  mockUsers.set(doctorRevokedId.toString(), {
    _id: doctorRevokedId,
    fullName: 'Dr. Gregory House',
    role: 'doctor',
    isActive: true,
  });

  // Seed Connections
  mockConnections.set(`${doctorWithPermissionId}_${patientIdA}`, {
    doctor: doctorWithPermissionId,
    patient: patientIdA,
    status: 'approved',
    permissions: { reports: true, healthRecords: true, notes: true },
  });

  mockConnections.set(`${doctorWithoutPermissionId}_${patientIdA}`, {
    doctor: doctorWithoutPermissionId,
    patient: patientIdA,
    status: 'approved',
    permissions: { reports: false, healthRecords: true, notes: true },
  });

  mockConnections.set(`${doctorRevokedId}_${patientIdA}`, {
    doctor: doctorRevokedId,
    patient: patientIdA,
    status: 'revoked',
    permissions: { reports: true },
  });

  // Seed Health Records for Patient A
  mockHealthRecords.push({
    _id: new mongoose.Types.ObjectId(),
    user: patientIdA,
    recordDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    weight: 68.5,
    bloodPressure: { systolic: 120, diastolic: 80 },
    bloodSugar: 98,
    heartRate: 72,
    temperature: 36.6,
  });

  // Patch Mongoose methods
  User.findById = (id) => {
    const u = mockUsers.get(id?.toString());
    return {
      select: () => Promise.resolve(u || null),
    };
  };

  DoctorPatientConnection.findOne = (query) => {
    const key = `${query.doctor}_${query.patient}`;
    const conn = mockConnections.get(key);
    return Promise.resolve(conn || null);
  };

  HealthRecord.find = (query) => {
    const matched = mockHealthRecords.filter((r) => {
      if (query.user && r.user.toString() !== query.user.toString()) return false;
      if (query.recordDate && query.recordDate.$gte && r.recordDate < query.recordDate.$gte) return false;
      if (query.recordDate && query.recordDate.$lte && r.recordDate > query.recordDate.$lte) return false;
      return true;
    });
    return {
      sort: () => ({
        lean: () => Promise.resolve(matched),
      }),
    };
  };

  HealthReport.create = (doc) => {
    const newDoc = {
      _id: new mongoose.Types.ObjectId(),
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockReports.push(newDoc);
    return Promise.resolve(newDoc);
  };

  HealthReport.findOne = (query) => {
    const report = mockReports.find((r) => {
      let match = true;
      if (query._id && !r._id.equals(query._id)) match = false;
      if (query.user && r.user.toString() !== query.user.toString()) match = false;
      if (query.reportType && r.reportType !== query.reportType) match = false;
      return match;
    });
    return {
      sort: () => ({
        lean: () => Promise.resolve(report || null),
      }),
      then: (fn) => fn(report || null),
    };
  };

  HealthReport.findById = (id) => {
    const report = mockReports.find((r) => r._id.equals(id));
    return {
      lean: () => Promise.resolve(report || null),
    };
  };

  HealthReport.find = (query) => {
    let list = mockReports.filter((r) => {
      if (query.user && r.user.toString() !== query.user.toString()) return false;
      if (query.reportType && r.reportType !== query.reportType) return false;
      return true;
    });
    return {
      sort: () => ({
        skip: (s) => ({
          limit: (l) => ({
            lean: () => Promise.resolve(list.slice(s, s + l)),
          }),
        }),
      }),
    };
  };

  HealthReport.countDocuments = (query) => {
    const list = mockReports.filter((r) => {
      if (query.user && r.user.toString() !== query.user.toString()) return false;
      return true;
    });
    return Promise.resolve(list.length);
  };

  // Mock services
  adherenceService.calculateAdherence = () =>
    Promise.resolve({
      totalScheduled: 14,
      taken: 13,
      missed: 1,
      skipped: 0,
      pending: 0,
      adherenceScore: 92.86,
      category: 'Excellent',
    });

  doctorNoteService.getPatientRecommendations = () =>
    Promise.resolve({
      recommendations: [
        {
          title: 'Daily Walking Routine',
          content: 'Walk at moderate pace for 30 minutes each morning.',
          priority: 'normal',
          doctor: { fullName: 'Dr. Evelyn Reed', specialization: 'Cardiology' },
          createdAt: new Date(),
        },
      ],
    });

  notificationService.createNotification = (n) => {
    mockNotifications.push(n);
    return Promise.resolve({ notification: n, created: true });
  };

  // -------------------------------------------------------------
  // Test 1: Weekly report generation
  // -------------------------------------------------------------
  let weeklyReport = null;
  try {
    weeklyReport = await reportService.generateWeeklyReport(patientIdA.toString());
    assertTest(
      'Test 1: Weekly report generated with correct structure',
      weeklyReport &&
        weeklyReport.reportType === 'weekly' &&
        weeklyReport.medicationSummary.totalScheduled === 14 &&
        weeklyReport.healthSummary.latestBloodPressure.systolic === 120
    );
  } catch (err) {
    assertTest('Test 1: Weekly report generated with correct structure', false);
  }

  // -------------------------------------------------------------
  // Test 2: Monthly report generation
  // -------------------------------------------------------------
  let monthlyReport = null;
  try {
    monthlyReport = await reportService.generateMonthlyReport(patientIdA.toString());
    assertTest(
      'Test 2: Monthly report generated with 30-day scope',
      monthlyReport && monthlyReport.reportType === 'monthly'
    );
  } catch (err) {
    assertTest('Test 2: Monthly report generated with 30-day scope', false);
  }

  // -------------------------------------------------------------
  // Test 3: Custom report generation
  // -------------------------------------------------------------
  let customReport = null;
  try {
    customReport = await reportService.generateCustomReport(patientIdA.toString(), {
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    });
    assertTest(
      'Test 3: Custom report generated with custom date boundaries',
      customReport && customReport.reportType === 'custom'
    );
  } catch (err) {
    assertTest('Test 3: Custom report generated with custom date boundaries', false);
  }

  // -------------------------------------------------------------
  // Test 4: Duplicate report prevention (idempotency)
  // -------------------------------------------------------------
  try {
    const duplicateCheck = await reportService.generateWeeklyReport(patientIdA.toString());
    assertTest(
      'Test 4: Duplicate report generation returns existing document without duplicate entry',
      duplicateCheck._id.equals(weeklyReport._id)
    );
  } catch (err) {
    assertTest('Test 4: Duplicate report generation returns existing document', false);
  }

  // -------------------------------------------------------------
  // Test 5: Empty data handling
  // -------------------------------------------------------------
  try {
    // Patient B has no records
    const emptyReport = await reportService.generateReport({
      userId: patientIdB.toString(),
      reportType: 'weekly',
    });
    assertTest(
      'Test 5: Empty data handled gracefully without crashes or null dereferences',
      emptyReport &&
        emptyReport.healthSummary.recordCount === 0 &&
        emptyReport.healthSummary.latestWeight === null
    );
  } catch (err) {
    assertTest('Test 5: Empty data handled gracefully', false);
  }

  // -------------------------------------------------------------
  // Test 6: Notification creation
  // -------------------------------------------------------------
  const reportNotif = mockNotifications.find(
    (n) => n.user.toString() === patientIdA.toString() && n.type === 'report_ready'
  );
  assertTest(
    'Test 6: report_ready notification dispatched to patient upon report generation',
    !!reportNotif && reportNotif.title === 'Health report ready'
  );

  // -------------------------------------------------------------
  // Test 7: Patient-visible recommendations included
  // -------------------------------------------------------------
  assertTest(
    'Test 7: Patient-visible recommendations included in report',
    weeklyReport.recommendations.length > 0 &&
      weeklyReport.recommendations[0].title === 'Daily Walking Routine'
  );

  // -------------------------------------------------------------
  // Test 8: No medical conclusions or diagnosis in summary
  // -------------------------------------------------------------
  const forbiddenWords = ['hypertension', 'diabetic', 'diabetes', 'dangerous', 'stop taking', 'diagnosis'];
  const summaryLower = weeklyReport.summary.toLowerCase();
  const hasDiagnosis = forbiddenWords.some((w) => summaryLower.includes(w));
  assertTest(
    'Test 8: Report summary uses neutral language and contains no medical diagnoses',
    !hasDiagnosis && summaryLower.includes('telemetry report')
  );

  // -------------------------------------------------------------
  // Test 9: Patient can access own report
  // -------------------------------------------------------------
  try {
    const accessed = await reportService.getReportById(weeklyReport._id.toString(), {
      id: patientIdA.toString(),
      role: 'patient',
    });
    assertTest('Test 9: Patient can access own report', !!accessed);
  } catch (err) {
    assertTest('Test 9: Patient can access own report', false);
  }

  // -------------------------------------------------------------
  // Test 10: Patient cannot access another user's report (403)
  // -------------------------------------------------------------
  try {
    await reportService.getReportById(weeklyReport._id.toString(), {
      id: patientIdB.toString(), // Patient B
      role: 'patient',
    });
    assertTest("Test 10: Patient cannot access another patient's report (IDOR blocked)", false);
  } catch (err) {
    assertTest("Test 10: Patient cannot access another patient's report (IDOR blocked)", err.statusCode === 403);
  }

  // -------------------------------------------------------------
  // Test 11: Connected doctor with reports permission can view report
  // -------------------------------------------------------------
  try {
    const docAccess = await reportService.getReportById(weeklyReport._id.toString(), {
      id: doctorWithPermissionId.toString(),
      role: 'doctor',
    });
    assertTest('Test 11: Connected doctor with reports permission can access patient report', !!docAccess);
  } catch (err) {
    assertTest('Test 11: Connected doctor with reports permission can access patient report', false);
  }

  // -------------------------------------------------------------
  // Test 12: Doctor without reports permission is denied (403)
  // -------------------------------------------------------------
  try {
    await reportService.getReportById(weeklyReport._id.toString(), {
      id: doctorWithoutPermissionId.toString(),
      role: 'doctor',
    });
    assertTest('Test 12: Doctor without reports permission is denied with 403', false);
  } catch (err) {
    assertTest('Test 12: Doctor without reports permission is denied with 403', err.statusCode === 403 && err.message.includes('Report access is disabled'));
  }

  // -------------------------------------------------------------
  // Test 13: Revoked doctor connection is denied (403)
  // -------------------------------------------------------------
  try {
    await reportService.getReportById(weeklyReport._id.toString(), {
      id: doctorRevokedId.toString(),
      role: 'doctor',
    });
    assertTest('Test 13: Revoked doctor connection is denied with 403', false);
  } catch (err) {
    assertTest('Test 13: Revoked doctor connection is denied with 403', err.statusCode === 403 && err.message.includes('not approved'));
  }

  // -------------------------------------------------------------
  // Test 14: Validation rejects invalid dates and report types
  // -------------------------------------------------------------
  const badReq = {
    body: { reportType: 'invalid_type', startDate: '2026-09-30', endDate: '2026-09-01' },
    params: {},
    query: {},
  };
  const valResult = await runValidator(generateReportValidator, badReq);
  const errors = valResult.array();
  const hasTypeError = errors.some((e) => e.msg.includes('Report type must be one of'));
  const hasDateOrderError = errors.some((e) => e.msg.includes('Start date cannot be after end date'));
  assertTest('Test 14: Validation rejects invalid type and inverted date range', hasTypeError && hasDateOrderError);

  console.log('===============================================================');
  console.log(`Step 23 Test Results: ${passed} passed, ${failed} failed out of ${passed + failed}`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runHealthReportTests().catch((err) => {
  console.error('Test execution encountered error:', err);
  process.exit(1);
});
