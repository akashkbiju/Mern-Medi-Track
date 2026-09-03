import mongoose from 'mongoose';
import { pdfReportService } from '../services/pdfReportService.js';
import { reportService } from '../services/reportService.js';
import HealthReport from '../models/HealthReport.js';
import DoctorPatientConnection from '../models/DoctorPatientConnection.js';
import fs from 'fs';
import path from 'path';

/**
 * Step 24 Automated Verification Test Suite: PDF Report Generation
 */
async function runPdfReportTests() {
  console.log('===============================================================');
  console.log('Starting Step 24 PDF Report Generation Test Suite');
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

  const patientIdA = new mongoose.Types.ObjectId();
  const patientIdB = new mongoose.Types.ObjectId();
  const doctorWithReportsId = new mongoose.Types.ObjectId();
  const doctorWithoutReportsId = new mongoose.Types.ObjectId();
  const reportId1 = new mongoose.Types.ObjectId();

  const sampleReport = {
    _id: reportId1,
    user: patientIdA,
    reportType: 'weekly',
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2026-09-07T23:59:59.999Z'),
    createdAt: new Date('2026-09-08T10:00:00.000Z'),
    patientInfo: {
      name: 'Alice Patient',
      email: 'alice.patient@test.com',
      gender: 'female',
      age: 36,
    },
    summary: 'During this weekly cycle, 92% adherence was achieved across 14 doses. Blood pressure and vitals remained within standard ranges.',
    medicationSummary: {
      totalScheduled: 14,
      dosesTaken: 13,
      dosesMissed: 1,
      adherenceScore: 92,
      activeMedicationsCount: 2,
    },
    healthSummary: {
      latestBloodPressure: {
        systolic: 120,
        diastolic: 80,
        unit: 'mmHg',
        date: new Date('2026-09-07T08:00:00.000Z'),
      },
      latestBloodSugar: {
        value: 95,
        unit: 'mg/dL',
        context: 'fasting',
        date: new Date('2026-09-07T08:00:00.000Z'),
      },
      latestHeartRate: {
        value: 72,
        unit: 'bpm',
        date: new Date('2026-09-07T08:00:00.000Z'),
      },
      latestWeight: {
        value: 65,
        unit: 'kg',
        date: new Date('2026-09-07T08:00:00.000Z'),
      },
      latestTemperature: {
        value: 36.6,
        unit: 'C',
        date: new Date('2026-09-07T08:00:00.000Z'),
      },
    },
    recommendations: [
      {
        title: 'Maintain Hydration & Sodium Balance',
        content: 'Continue 2.5L daily water intake and avoid high-sodium processed foods.',
        priority: 'normal',
        doctorName: 'Dr. Sarah Connor',
        specialization: 'Cardiology',
        hospital: 'Metro General Hospital',
        date: new Date('2026-09-06T14:30:00.000Z'),
      },
    ],
  };

  try {
    // -------------------------------------------------------------
    // Test 1: PDF Buffer Generation
    // -------------------------------------------------------------
    console.log('\n--- Section 1: Binary PDF Generation & Format ---');
    const pdfBuffer = await pdfReportService.generateReportPDF(sampleReport);

    assertTest(
      'pdfReportService returns a valid Buffer instance',
      Buffer.isBuffer(pdfBuffer)
    );

    assertTest(
      'PDF buffer begins with standard PDF header (%PDF-)',
      pdfBuffer.toString('utf8', 0, 5) === '%PDF-'
    );

    assertTest(
      `Generated PDF buffer size is substantial (> 1KB, actual: ${pdfBuffer.length} bytes)`,
      pdfBuffer.length > 1000
    );

    // -------------------------------------------------------------
    // Test 2: Safe Storage & File Reference
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Storage Reference & Caching ---');
    const safeRef = pdfReportService.getSafeFilePath(reportId1);
    assertTest(
      'getSafeFilePath provides safe relative path without directory traversal',
      safeRef === `storage/reports/report-${reportId1}.pdf`
    );

    // -------------------------------------------------------------
    // Test 3: PDF Generation With Missing Optional Vitals
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Robustness With Partial Data ---');
    const partialReport = {
      _id: new mongoose.Types.ObjectId(),
      user: patientIdA,
      reportType: 'monthly',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2026-08-31T23:59:59.999Z'),
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      patientInfo: { name: 'Bob Partial' },
      medicationSummary: { totalScheduled: 0, dosesTaken: 0, adherenceScore: null },
      healthSummary: {},
      recommendations: [],
    };

    const partialBuffer = await pdfReportService.generateReportPDF(partialReport);
    assertTest(
      'PDF generates cleanly when report has empty vitals and no recommendations',
      Buffer.isBuffer(partialBuffer) && partialBuffer.toString('utf8', 0, 5) === '%PDF-'
    );

    // -------------------------------------------------------------
    // Test 4: Access Control & Authorization Checks
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Access Control & Security ---');

    // Mock HealthReport.findById
    HealthReport.findById = (id) => ({
      lean: async () => {
        if (id.toString() === reportId1.toString()) {
          return sampleReport;
        }
        return null;
      },
    });

    // Mock DoctorPatientConnection.findOne
    DoctorPatientConnection.findOne = ({ doctor, patient }) => ({
      async then(resolve) {
        if (
          doctor.toString() === doctorWithReportsId.toString() &&
          patient.toString() === patientIdA.toString()
        ) {
          resolve({
            doctor: doctorWithReportsId,
            patient: patientIdA,
            status: 'approved',
            permissions: { reports: true },
          });
        } else if (
          doctor.toString() === doctorWithoutReportsId.toString() &&
          patient.toString() === patientIdA.toString()
        ) {
          resolve({
            doctor: doctorWithoutReportsId,
            patient: patientIdA,
            status: 'approved',
            permissions: { reports: false },
          });
        } else {
          resolve(null);
        }
      },
    });

    // Patient owner retrieval
    const ownerReport = await reportService.getReportById(reportId1.toString(), {
      id: patientIdA.toString(),
      role: 'patient',
    });
    assertTest(
      'Patient owner can successfully retrieve report for PDF rendering',
      ownerReport && ownerReport._id.toString() === reportId1.toString()
    );

    // Unrelated patient access (IDOR attempt)
    let idorBlocked = false;
    try {
      await reportService.getReportById(reportId1.toString(), {
        id: patientIdB.toString(),
        role: 'patient',
      });
    } catch (err) {
      if (err.statusCode === 403) idorBlocked = true;
    }
    assertTest(
      'Unrelated patient is blocked from viewing/downloading report (IDOR protection)',
      idorBlocked
    );

    // Connected doctor with reports permission
    const doctorPermittedReport = await reportService.getReportById(reportId1.toString(), {
      id: doctorWithReportsId.toString(),
      role: 'doctor',
    });
    assertTest(
      'Doctor with approved connection and reports permission can access report',
      doctorPermittedReport && doctorPermittedReport._id.toString() === reportId1.toString()
    );

    // Connected doctor without reports permission
    let doctorForbidden = false;
    try {
      await reportService.getReportById(reportId1.toString(), {
        id: doctorWithoutReportsId.toString(),
        role: 'doctor',
      });
    } catch (err) {
      if (err.statusCode === 403) doctorForbidden = true;
    }
    assertTest(
      'Doctor with reports permission disabled cannot access report',
      doctorForbidden
    );

    // Non-existent report
    let notFoundBlocked = false;
    try {
      await reportService.getReportById(new mongoose.Types.ObjectId().toString(), {
        id: patientIdA.toString(),
        role: 'patient',
      });
    } catch (err) {
      if (err.statusCode === 404) notFoundBlocked = true;
    }
    assertTest('Non-existent report ID returns 404 Not Found', notFoundBlocked);

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`Step 24 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPdfReportTests();
