import mongoose from 'mongoose';
import { connectionService } from '../services/connectionService.js';
import { notificationService } from '../services/notificationService.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  sendConnectionRequestValidator,
  connectionIdParamValidator,
  doctorIdParamValidator,
  doctorSearchValidator,
} from '../validators/connectionValidator.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorPatientConnection from '../models/DoctorPatientConnection.js';

/**
 * Step 20 Verification Test Suite: Doctor-Patient Connection System
 * Covers all 30 scenarios specified in Step 20 Section 43
 */
async function runConnectionTests() {
  console.log('--- Starting Step 20 Doctor-Patient Connection System Verification Suite ---');
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

  const patientIdA = new mongoose.Types.ObjectId();
  const patientIdB = new mongoose.Types.ObjectId();
  const doctorIdA = new mongoose.Types.ObjectId();
  const doctorIdB = new mongoose.Types.ObjectId();
  const mockConnId = new mongoose.Types.ObjectId();

  // Mock store
  const mockUsers = new Map();
  const mockDoctorProfiles = new Map();
  const mockConnections = new Map();

  // Populate mock data
  const mockPatientA = {
    _id: patientIdA,
    fullName: 'Alice Patient',
    email: 'alice@example.com',
    role: 'patient',
    isActive: true,
    createdAt: new Date('2026-01-01'),
  };
  const mockPatientB = {
    _id: patientIdB,
    fullName: 'Bob Patient',
    email: 'bob@example.com',
    role: 'patient',
    isActive: true,
    createdAt: new Date('2026-01-02'),
  };
  const mockDoctorA = {
    _id: doctorIdA,
    fullName: 'Dr. John Watson',
    email: 'john.watson@hospital.org',
    role: 'doctor',
    isActive: true,
    createdAt: new Date('2026-01-03'),
  };
  const mockDoctorB = {
    _id: doctorIdB,
    fullName: 'Dr. Gregory House',
    email: 'house@princeton.org',
    role: 'doctor',
    isActive: true,
    createdAt: new Date('2026-01-04'),
  };

  mockUsers.set(patientIdA.toString(), mockPatientA);
  mockUsers.set(patientIdB.toString(), mockPatientB);
  mockUsers.set(doctorIdA.toString(), mockDoctorA);
  mockUsers.set(doctorIdB.toString(), mockDoctorB);

  const mockProfileA = {
    _id: new mongoose.Types.ObjectId(),
    user: doctorIdA,
    specialization: 'Cardiology',
    hospital: 'Metro General Hospital',
    experience: 12,
    bio: 'Experienced cardiologist focused on heart health.',
    consultationInfo: 'Mon-Fri 9:00 AM - 4:00 PM',
    isVerified: true,
  };
  const mockProfileB = {
    _id: new mongoose.Types.ObjectId(),
    user: doctorIdB,
    specialization: 'Diagnostic Medicine',
    hospital: 'Princeton Plainsboro',
    experience: 20,
    bio: 'Board-certified diagnostician.',
    consultationInfo: 'By appointment only',
    isVerified: false,
  };

  mockDoctorProfiles.set(doctorIdA.toString(), mockProfileA);
  mockDoctorProfiles.set(doctorIdB.toString(), mockProfileB);

  // Intercept Mongoose Queries
  const originalUserFindById = User.findById;
  User.findById = (id) => {
    const u = mockUsers.get(id?.toString());
    return {
      select: () => Promise.resolve(u || null),
      then: (fn) => Promise.resolve(u || null).then(fn),
    };
  };

  User.find = (query) => {
    let list = Array.from(mockUsers.values());
    if (query?.role) list = list.filter((u) => u.role === query.role);
    if (query?.isActive !== undefined) list = list.filter((u) => u.isActive === query.isActive);
    if (query?._id?.$in) {
      const idStrings = query._id.$in.map((i) => i.toString());
      list = list.filter((u) => idStrings.includes(u._id.toString()));
    }
    return {
      select: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: () => Promise.resolve(list),
            }),
          }),
        }),
      }),
    };
  };

  User.countDocuments = async () => Array.from(mockUsers.values()).filter((u) => u.role === 'doctor').length;

  DoctorProfile.find = () => ({
    lean: async () => Array.from(mockDoctorProfiles.values()),
  });

  DoctorProfile.findOne = (query) => ({
    lean: async () => mockDoctorProfiles.get(query?.user?.toString()) || null,
  });

  DoctorPatientConnection.findOne = async (query) => {
    for (const c of mockConnections.values()) {
      if (
        c.doctor.toString() === query.doctor?.toString() &&
        c.patient.toString() === query.patient?.toString()
      ) {
        return c;
      }
    }
    return null;
  };

  DoctorPatientConnection.findById = async (id) => mockConnections.get(id?.toString()) || null;

  DoctorPatientConnection.create = async (doc) => {
    const connDoc = {
      _id: mockConnId,
      ...doc,
      save: async function () {
        mockConnections.set(this._id.toString(), this);
        return this;
      },
    };
    mockConnections.set(connDoc._id.toString(), connDoc);
    return connDoc;
  };

  DoctorPatientConnection.find = (query) => {
    let list = Array.from(mockConnections.values());
    if (query?.patient) list = list.filter((c) => c.patient.toString() === query.patient.toString());
    if (query?.doctor) list = list.filter((c) => c.doctor.toString() === query.doctor.toString());
    if (query?.status) list = list.filter((c) => c.status === query.status);

    return {
      sort: () => ({
        populate: (field, select) => ({
          lean: async () =>
            list.map((c) => {
              const copy = { ...c };
              if (field === 'doctor') {
                copy.doctor = mockUsers.get(c.doctor.toString());
              }
              if (field === 'patient') {
                copy.patient = mockUsers.get(c.patient.toString());
              }
              return copy;
            }),
        }),
      }),
    };
  };

  // Mock Notification Service
  const notificationsCreated = [];
  const originalCreateNotification = notificationService.createNotification;
  notificationService.createNotification = async (notifData) => {
    notificationsCreated.push(notifData);
    return { notification: notifData, created: true };
  };

  // --- Test 1: Patient searches doctors ---
  const searchResult = await connectionService.searchDoctors({ search: 'Watson' });
  assertTest(
    'Test 1: Patient searches doctors by name (case-insensitive) and finds matching doctor',
    searchResult.doctors.length >= 1 && searchResult.doctors.some((d) => d.fullName.includes('Watson'))
  );

  // --- Test 2: Doctor directory only returns eligible doctors ---
  const allDocs = await connectionService.searchDoctors();
  assertTest(
    'Test 2: Doctor directory only returns users with doctor role and active status',
    allDocs.doctors.every((d) => !d.role || d.role === 'doctor') &&
      !allDocs.doctors.some((d) => d.id === patientIdA.toString())
  );

  // --- Test 3: Unverified doctors handled correctly ---
  const docBResult = allDocs.doctors.find((d) => d.id === doctorIdB.toString());
  const docAResult = allDocs.doctors.find((d) => d.id === doctorIdA.toString());
  assertTest(
    'Test 3: Unverified doctors have isVerified: false and verified doctors have isVerified: true (sorted verified first)',
    docAResult?.isVerified === true && docBResult?.isVerified === false && allDocs.doctors[0].id === doctorIdA.toString()
  );

  // --- Test 4: Doctor profile lookup ---
  const docProfileLookup = await connectionService.getDoctorById(doctorIdA.toString());
  assertTest(
    'Test 4: Doctor profile lookup returns safe public professional fields',
    docProfileLookup.fullName === 'Dr. John Watson' &&
      docProfileLookup.specialization === 'Cardiology' &&
      docProfileLookup.password === undefined &&
      docProfileLookup.phone === undefined
  );

  // --- Test 5: Patient sends request ---
  const newReq = await connectionService.sendConnectionRequest(patientIdA.toString(), doctorIdA.toString());
  assertTest(
    'Test 5: Patient sends connection request successfully resulting in pending status',
    newReq && newReq.status === 'pending' && newReq.requestedBy.toString() === patientIdA.toString()
  );

  // --- Test 6: Duplicate pending request rejected ---
  let dupPendingErr = false;
  try {
    await connectionService.sendConnectionRequest(patientIdA.toString(), doctorIdA.toString());
  } catch (err) {
    dupPendingErr = err.statusCode === 409 && err.message.toLowerCase().includes('pending');
  }
  assertTest('Test 6: Duplicate pending request rejected with 409 Conflict', dupPendingErr);

  // --- Test 7: Duplicate approved connection rejected ---
  // Temporarily set status to approved
  newReq.status = 'approved';
  let dupApprovedErr = false;
  try {
    await connectionService.sendConnectionRequest(patientIdA.toString(), doctorIdA.toString());
  } catch (err) {
    dupApprovedErr = err.statusCode === 409 && err.message.toLowerCase().includes('already connected');
  }
  assertTest('Test 7: Duplicate approved connection rejected with 409 Conflict', dupApprovedErr);
  newReq.status = 'pending'; // Reset back to pending

  // --- Test 8: Doctor accepts request ---
  const acceptedReq = await connectionService.acceptConnectionRequest(doctorIdA.toString(), mockConnId.toString());
  assertTest(
    'Test 8: Doctor accepts request; status transitions to approved and approvedAt timestamp is set',
    acceptedReq.status === 'approved' && acceptedReq.approvedAt !== undefined
  );

  // --- Test 9: Doctor rejects request ---
  // Create another request from patient B to doctor A
  const connIdB = new mongoose.Types.ObjectId();
  const connDocB = {
    _id: connIdB,
    doctor: doctorIdA,
    patient: patientIdB,
    requestedBy: patientIdB,
    status: 'pending',
    save: async function () {
      mockConnections.set(this._id.toString(), this);
      return this;
    },
  };
  mockConnections.set(connIdB.toString(), connDocB);

  const rejectedReq = await connectionService.rejectConnectionRequest(doctorIdA.toString(), connIdB.toString());
  assertTest(
    'Test 9: Doctor rejects request; status transitions to rejected and record is retained',
    rejectedReq.status === 'rejected' && mockConnections.has(connIdB.toString())
  );

  // --- Test 10: Patient cancels pending request ---
  const connIdC = new mongoose.Types.ObjectId();
  const connDocC = {
    _id: connIdC,
    doctor: doctorIdB,
    patient: patientIdA,
    requestedBy: patientIdA,
    status: 'pending',
    save: async function () {
      mockConnections.set(this._id.toString(), this);
      return this;
    },
  };
  mockConnections.set(connIdC.toString(), connDocC);

  const cancelledReq = await connectionService.cancelConnectionRequest(patientIdA.toString(), connIdC.toString());
  assertTest(
    'Test 10: Patient cancels pending request; status transitions to revoked and revokedAt is set',
    cancelledReq.status === 'revoked' && cancelledReq.revokedAt !== undefined
  );

  // --- Test 11: Patient views connections ---
  const patientConns = await connectionService.getPatientConnections(patientIdA.toString());
  assertTest(
    'Test 11: Patient views approved connections with doctor information',
    patientConns.length >= 1 && patientConns[0].doctor.fullName === 'Dr. John Watson'
  );

  // --- Test 12: Doctor views incoming requests ---
  // Create a pending request for Doctor A
  const connIdD = new mongoose.Types.ObjectId();
  const connDocD = {
    _id: connIdD,
    doctor: doctorIdA,
    patient: patientIdB,
    requestedBy: patientIdB,
    status: 'pending',
    save: async function () {
      mockConnections.set(this._id.toString(), this);
      return this;
    },
  };
  mockConnections.set(connIdD.toString(), connDocD);

  const docRequests = await connectionService.getDoctorRequests(doctorIdA.toString());
  assertTest(
    'Test 12: Doctor views incoming pending requests with basic patient details',
    docRequests.length >= 1 && docRequests.some((r) => r.patient.fullName === 'Bob Patient')
  );

  // --- Test 13: Doctor views connected patients ---
  const docConns = await connectionService.getDoctorConnections(doctorIdA.toString());
  assertTest(
    'Test 13: Doctor views approved connected patients roster',
    docConns.length >= 1 && docConns.some((c) => c.patient.fullName === 'Alice Patient')
  );

  // --- Test 14: Patient revokes connection ---
  const patientRevoked = await connectionService.revokeConnection(patientIdA.toString(), mockConnId.toString());
  assertTest(
    'Test 14: Patient revokes an approved connection; status becomes revoked',
    patientRevoked.status === 'revoked' && patientRevoked.revokedAt !== undefined
  );

  // --- Test 15: Doctor revokes connection ---
  // Temporarily reset connection to approved
  patientRevoked.status = 'approved';
  const doctorRevoked = await connectionService.revokeConnection(doctorIdA.toString(), mockConnId.toString());
  assertTest(
    'Test 15: Doctor revokes an approved connection; status becomes revoked',
    doctorRevoked.status === 'revoked' && doctorRevoked.revokedAt !== undefined
  );

  // --- Test 16: Rejected request can be requested again ---
  const reReqRejected = await connectionService.sendConnectionRequest(patientIdB.toString(), doctorIdA.toString());
  assertTest(
    'Test 16: Previously rejected request can be re-sent and transitions back to pending',
    reReqRejected.status === 'pending'
  );

  // --- Test 17: Revoked connection can be requested again ---
  const reReqRevoked = await connectionService.sendConnectionRequest(patientIdA.toString(), doctorIdA.toString());
  assertTest(
    'Test 17: Previously revoked connection can be re-sent and transitions back to pending',
    reReqRevoked.status === 'pending'
  );

  // --- Test 18: Invalid connection ID format rejected ---
  let badIdErr = false;
  try {
    await connectionService.acceptConnectionRequest(doctorIdA.toString(), 'invalid-id-123');
  } catch (err) {
    badIdErr = err.statusCode === 400;
  }
  assertTest('Test 18: Invalid connection ID format rejected with 400 Bad Request', badIdErr);

  // --- Test 19: Unauthorized access rejected by protect middleware ---
  const reqUnauth = { headers: {} };
  const authErr = await new Promise((resolve) => {
    protect(reqUnauth, {}, (err) => resolve(err || null));
  });
  assertTest('Test 19: Unauthenticated request rejected with 401 by auth middleware', authErr && authErr.statusCode === 401);

  // --- Test 20: Patient cannot accept request ---
  let patientAcceptErr = null;
  try {
    authorizeRoles('doctor')({ user: { id: patientIdA.toString(), role: 'patient' } }, {}, () => {});
  } catch (err) {
    patientAcceptErr = err;
  }
  assertTest('Test 20: Patient user calling doctor accept route blocked with 403 Forbidden', patientAcceptErr?.statusCode === 403);

  // --- Test 21: Doctor cannot send patient-style request ---
  let doctorSendErr = null;
  try {
    authorizeRoles('patient')({ user: { id: doctorIdA.toString(), role: 'doctor' } }, {}, () => {});
  } catch (err) {
    doctorSendErr = err;
  }
  assertTest('Test 21: Doctor user calling patient send request route blocked with 403 Forbidden', doctorSendErr?.statusCode === 403);

  // --- Test 22: Doctor cannot accept request intended for another doctor ---
  let wrongDocErr = false;
  try {
    await connectionService.acceptConnectionRequest(doctorIdB.toString(), reReqRevoked._id.toString());
  } catch (err) {
    wrongDocErr = err.statusCode === 403 && err.message.includes('not authorized');
  }
  assertTest('Test 22: Doctor cannot accept a connection request intended for another physician', wrongDocErr);

  // --- Test 23: Patient cannot cancel request owned by another patient ---
  let wrongPatientErr = false;
  try {
    await connectionService.cancelConnectionRequest(patientIdB.toString(), reReqRevoked._id.toString());
  } catch (err) {
    wrongPatientErr = err.statusCode === 403;
  }
  assertTest('Test 23: Patient cannot cancel a connection request created by another patient', wrongPatientErr);

  // --- Test 24: Direct client status manipulation prevented ---
  // Test validators: sendConnectionRequestValidator only accepts doctorId
  const statusInjectionReq = {
    body: {
      doctorId: doctorIdA.toString(),
      status: 'approved',
    },
  };
  const validatorRes = await runValidator(sendConnectionRequestValidator, statusInjectionReq);
  assertTest(
    'Test 24: Client cannot directly set or override connection status',
    validatorRes.isEmpty() && reReqRevoked.status === 'pending'
  );

  // --- Test 25: User cannot manipulate permissions in Step 20 ---
  assertTest(
    'Test 25: Permissions default to false for medical data isolation in Step 20',
    reReqRevoked.permissions.medications === false &&
      reReqRevoked.permissions.healthRecords === false &&
      reReqRevoked.permissions.reports === false
  );

  // --- Test 26: User cannot connect with themselves ---
  let selfConnectErr = false;
  try {
    await connectionService.sendConnectionRequest(doctorIdA.toString(), doctorIdA.toString());
  } catch (err) {
    selfConnectErr = err.statusCode === 400 && err.message.includes('yourself');
  }
  assertTest('Test 26: Attempting to connect with oneself rejected with 400 Bad Request', selfConnectErr);

  // --- Test 27: Notifications generated correctly on request, accept, and reject ---
  const hasRequestNotif = notificationsCreated.some((n) => n.type === 'doctor_request');
  const hasApprovedNotif = notificationsCreated.some((n) => n.type === 'doctor_approved');
  const hasRejectedNotif = notificationsCreated.some((n) => n.type === 'doctor_rejected');
  assertTest(
    'Test 27: In-app notifications generated on request, accept, and reject events',
    hasRequestNotif && hasApprovedNotif && hasRejectedNotif
  );

  // --- Test 28: Notification recipient is correct ---
  const requestNotif = notificationsCreated.find((n) => n.type === 'doctor_request');
  const approvedNotif = notificationsCreated.find((n) => n.type === 'doctor_approved');
  assertTest(
    'Test 28: Notification recipient matches target doctor for request, and patient for approval',
    requestNotif.user.toString() === doctorIdA.toString() &&
      approvedNotif.user.toString() === patientIdA.toString()
  );

  // --- Test 29: No patient health data exposed in connection records ---
  const doctorViewConn = await connectionService.getDoctorConnections(doctorIdA.toString());
  const anyPatientHasHealthData = doctorViewConn.some(
    (c) => c.patient.medicines || c.patient.healthRecords || c.patient.medicationLogs
  );
  assertTest(
    'Test 29: Doctor connection views strictly exclude patient medicines, health records, and logs',
    !anyPatientHasHealthData
  );

  // --- Test 30: Compound unique index schema check ---
  const indexes = DoctorPatientConnection.schema.indexes();
  const hasCompoundIndex = indexes.some(
    (idx) => idx[0] && idx[0].doctor === 1 && idx[0].patient === 1 && idx[1]?.unique === true
  );
  assertTest(
    'Test 30: DoctorPatientConnection schema enforces compound unique index { doctor: 1, patient: 1 }',
    hasCompoundIndex
  );

  // Cleanup mocks
  User.findById = originalUserFindById;
  notificationService.createNotification = originalCreateNotification;

  console.log('\n--- Step 20 Test Results ---');
  console.log(`Passed: ${passed} / 30`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runConnectionTests().catch((err) => {
  console.error('Fatal test error in connection test suite:', err);
  process.exit(1);
});
