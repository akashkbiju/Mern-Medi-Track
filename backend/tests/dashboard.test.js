import mongoose from 'mongoose';
import { dashboardService } from '../services/dashboardService.js';
import { medicationLogService } from '../services/medicationLogService.js';
import { adherenceService } from '../services/adherenceService.js';
import { reminderService } from '../services/reminderService.js';
import { doctorNoteService } from '../services/doctorNoteService.js';
import Medicine from '../models/Medicine.js';
import HealthRecord from '../models/HealthRecord.js';
import HealthReport from '../models/HealthReport.js';
import DoctorPatientConnection from '../models/DoctorPatientConnection.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorNote from '../models/DoctorNote.js';
import Notification from '../models/Notification.js';

/**
 * Step 25 Automated Verification Test Suite: Dashboard Integration
 */
async function runDashboardTests() {
  console.log('===============================================================');
  console.log('Starting Step 25 Dashboard Integration Test Suite');
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

  const patientId = new mongoose.Types.ObjectId();
  const doctorId = new mongoose.Types.ObjectId();

  // Mock dependent services
  medicationLogService.getTodayMedicationLogs = () =>
    Promise.resolve({
      stats: { total: 4, taken: 3, missed: 0, pending: 1, skipped: 0, completionRate: 75 },
    });

  adherenceService.getAdherenceSummary = () =>
    Promise.resolve({
      hasData: true,
      adherenceScore: 92,
      category: 'Excellent',
      taken: 12,
      totalEligible: 13,
      currentStreak: 5,
    });

  reminderService.generateUpcomingReminders = () =>
    Promise.resolve([
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Morning Dose',
        scheduledFor: new Date(),
        relatedMedicine: { name: 'Metformin', dosage: '500mg' },
      },
    ]);

  doctorNoteService.getPatientRecommendations = () =>
    Promise.resolve({
      recommendations: [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Hydration Protocol',
          content: 'Drink 2.5L water daily.',
          priority: 'normal',
          doctor: { fullName: 'Sarah Connor' },
        },
      ],
    });

  // Mock Mongoose models
  Medicine.countDocuments = () => Promise.resolve(3);
  HealthRecord.findOne = () => ({
    sort: () => ({
      lean: () => Promise.resolve({
        bloodPressure: { systolic: 120, diastolic: 80 },
        bloodSugar: 95,
        bloodSugarUnit: 'mg/dL',
        heartRate: 72,
        weight: 68,
        weightUnit: 'kg',
        temperature: 36.6,
        temperatureUnit: 'C',
        recordDate: new Date(),
      }),
    }),
  });
  HealthReport.findOne = () => ({
    sort: () => ({
      lean: () => Promise.resolve({
        _id: new mongoose.Types.ObjectId(),
        reportType: 'weekly',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-07'),
        summary: 'Consistent 92% adherence over weekly evaluation window.',
        medicationSummary: { adherenceScore: 92 },
        createdAt: new Date(),
      }),
    }),
  });
  DoctorPatientConnection.find = () => ({
    populate: () => ({
      lean: () => Promise.resolve([
        {
          _id: new mongoose.Types.ObjectId(),
          doctor: { fullName: 'Dr. Gregory House', email: 'house@princeton.edu' },
          permissions: { healthRecords: true, medications: true, notes: true, reports: true },
          updatedAt: new Date(),
        },
      ]),
    }),
    sort: () => ({
      limit: () => ({
        populate: () => ({
          lean: () => Promise.resolve([
            {
              _id: new mongoose.Types.ObjectId(),
              patient: { fullName: 'Alice Patient', email: 'alice@test.com' },
              permissions: { healthRecords: true, medications: true, notes: true, reports: true },
              updatedAt: new Date(),
            },
          ]),
        }),
      }),
    }),
  });
  DoctorPatientConnection.countDocuments = () => Promise.resolve(1);
  DoctorProfile.findOne = () => ({
    lean: () => Promise.resolve({
      doctor: doctorId,
      specialization: 'Internal Medicine',
      licenseNumber: 'MD-99881',
      hospital: 'Princeton Plainsboro',
      isVerified: true,
    }),
  });
  DoctorNote.find = () => ({
    sort: () => ({
      limit: () => ({
        populate: () => ({
          lean: () => Promise.resolve([
            {
              _id: new mongoose.Types.ObjectId(),
              patient: { fullName: 'Alice Patient' },
              title: 'Hydration Guidelines',
              content: 'Maintain 2.5L daily hydration.',
              type: 'recommendation',
              visibility: 'patient_visible',
              priority: 'normal',
              createdAt: new Date(),
            },
          ]),
        }),
      }),
    }),
  });
  Notification.countDocuments = () => Promise.resolve(2);

  try {
    // -------------------------------------------------------------
    // Test 1: Patient Dashboard Structure
    // -------------------------------------------------------------
    console.log('\n--- Section 1: Patient Dashboard Telemetry Aggregation ---');
    const patientDash = await dashboardService.getPatientDashboardData(patientId.toString());

    assertTest('Patient dashboard returns medication module with active count', patientDash?.medication?.activeCount === 3);
    assertTest('Patient dashboard returns today log completion rate', patientDash?.medication?.today?.completionRate === 75);
    assertTest('Patient dashboard returns 7-day adherence stats', patientDash?.medication?.adherence?.adherenceScore === 92);
    assertTest('Patient dashboard returns health module with vitals object', patientDash?.health?.vitals?.bloodPressure === '120/80 mmHg');
    assertTest('Patient dashboard returns connectedDoctors array', patientDash?.doctor?.connectedDoctors?.length === 1);
    assertTest('Patient dashboard returns latestReport with adherenceScore', patientDash?.reports?.latestReport?.adherenceScore === 92);
    assertTest('Patient dashboard returns unread notification count', patientDash?.notifications?.unreadCount === 2);

    // -------------------------------------------------------------
    // Test 2: Doctor Dashboard Structure
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Doctor Dashboard Telemetry Aggregation ---');
    const doctorDash = await dashboardService.getDoctorDashboardData(doctorId.toString());

    assertTest('Doctor dashboard returns profile with licenseNumber', doctorDash?.profile?.licenseNumber === 'MD-99881');
    assertTest('Doctor dashboard stats track connectedPatientCount', doctorDash?.stats?.connectedPatientCount === 1);
    assertTest('Doctor dashboard stats track pendingRequestCount', doctorDash?.stats?.pendingRequestCount === 1);
    assertTest('Doctor dashboard returns roster with connectedPatients', Array.isArray(doctorDash?.roster?.connectedPatients));
    assertTest('Doctor dashboard returns recentNotes array', doctorDash?.recentNotes?.length === 1);

    // -------------------------------------------------------------
    // Test 3: Resilience to Missing / Null IDs
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Subsystem Failure Resilience ---');
    const resilientPatientDash = await dashboardService.getPatientDashboardData(null);
    assertTest('Patient dashboard survives null userId safely', Boolean(resilientPatientDash));

    const resilientDoctorDash = await dashboardService.getDoctorDashboardData(null);
    assertTest('Doctor dashboard survives null doctorId safely', Boolean(resilientDoctorDash));

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`Step 25 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDashboardTests();
