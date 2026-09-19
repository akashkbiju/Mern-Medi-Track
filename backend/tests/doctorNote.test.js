import mongoose from 'mongoose';
import { doctorNoteService } from '../services/doctorNoteService.js';
import { connectionAccessService } from '../services/connectionAccessService.js';
import { notificationService } from '../services/notificationService.js';
import DoctorNote from '../models/DoctorNote.js';
import DoctorPatientConnection from '../models/DoctorPatientConnection.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import Notification from '../models/Notification.js';
import {
  createDoctorNoteValidator,
  updateDoctorNoteValidator,
  doctorNotesQueryValidator,
  doctorNoteParamsValidator,
  patientRecommendationsQueryValidator,
} from '../validators/doctorNoteValidator.js';

/**
 * Step 22 Automated Verification Test Suite: Doctor Notes & Recommendations
 */
async function runDoctorNoteTests() {
  console.log('===============================================================');
  console.log('Starting Step 22 Doctor Notes & Recommendations Test Suite');
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
  const doctorIdA = new mongoose.Types.ObjectId();
  const doctorIdB = new mongoose.Types.ObjectId();
  const unconnectedDoctorId = new mongoose.Types.ObjectId();
  const patientIdA = new mongoose.Types.ObjectId();
  const patientIdB = new mongoose.Types.ObjectId();

  const connApprovedId = new mongoose.Types.ObjectId();
  const connRevokedId = new mongoose.Types.ObjectId();
  const connNoNotesId = new mongoose.Types.ObjectId();
  const connDocBPatientAId = new mongoose.Types.ObjectId();

  // In-memory data store
  const mockUsers = new Map();
  const mockDoctorProfiles = new Map();
  const mockConnections = new Map();
  const mockNotes = [];
  const mockNotifications = [];

  // Seed Users
  mockUsers.set(doctorIdA.toString(), {
    _id: doctorIdA,
    fullName: 'Dr. Alice Smith',
    email: 'alice@meditrack.test',
    role: 'doctor',
    isActive: true,
  });

  mockUsers.set(doctorIdB.toString(), {
    _id: doctorIdB,
    fullName: 'Dr. Bob Jones',
    email: 'bob@meditrack.test',
    role: 'doctor',
    isActive: true,
  });

  mockUsers.set(unconnectedDoctorId.toString(), {
    _id: unconnectedDoctorId,
    fullName: 'Dr. Charles Stranger',
    email: 'charles@meditrack.test',
    role: 'doctor',
    isActive: true,
  });

  mockUsers.set(patientIdA.toString(), {
    _id: patientIdA,
    fullName: 'John Patient',
    email: 'john@patient.test',
    role: 'patient',
    isActive: true,
  });

  mockUsers.set(patientIdB.toString(), {
    _id: patientIdB,
    fullName: 'Mary Patient',
    email: 'mary@patient.test',
    role: 'patient',
    isActive: true,
  });

  // Seed Doctor Profiles
  mockDoctorProfiles.set(doctorIdA.toString(), {
    user: doctorIdA,
    specialization: 'Cardiology',
    hospital: 'Metro General Hospital',
  });

  mockDoctorProfiles.set(doctorIdB.toString(), {
    user: doctorIdB,
    specialization: 'Endocrinology',
    hospital: 'City Health Clinic',
  });

  // Seed Connections
  // Doctor A + Patient A: Approved with notes permission
  mockConnections.set(`${doctorIdA}_${patientIdA}`, {
    _id: connApprovedId,
    doctor: doctorIdA,
    patient: patientIdA,
    status: 'approved',
    permissions: { medications: true, healthRecords: true, reports: true, notes: true },
  });

  // Doctor B + Patient A: Approved
  mockConnections.set(`${doctorIdB}_${patientIdA}`, {
    _id: connDocBPatientAId,
    doctor: doctorIdB,
    patient: patientIdA,
    status: 'approved',
    permissions: { notes: true },
  });

  // Doctor A + Patient B: Revoked connection
  mockConnections.set(`${doctorIdA}_${patientIdB}`, {
    _id: connRevokedId,
    doctor: doctorIdA,
    patient: patientIdB,
    status: 'revoked',
    permissions: { notes: true },
  });

  // Doctor B + Patient B: Connection with notes permission disabled
  mockConnections.set(`${doctorIdB}_${patientIdB}`, {
    _id: connNoNotesId,
    doctor: doctorIdB,
    patient: patientIdB,
    status: 'approved',
    permissions: { notes: false },
  });

  // Patch Mongoose methods to use test fixtures
  User.findById = (id) => {
    const u = mockUsers.get(id?.toString());
    return {
      select: () => Promise.resolve(u || null),
    };
  };

  DoctorProfile.find = (query) => {
    const list = [];
    if (query?.user?.$in) {
      for (const uid of query.user.$in) {
        const p = mockDoctorProfiles.get(uid.toString());
        if (p) list.push(p);
      }
    }
    return {
      select: () => ({
        lean: () => Promise.resolve(list),
      }),
    };
  };

  DoctorPatientConnection.findOne = (query) => {
    const key = `${query.doctor}_${query.patient}`;
    const conn = mockConnections.get(key);
    return Promise.resolve(conn || null);
  };

  DoctorPatientConnection.find = (query) => {
    const results = [];
    for (const conn of mockConnections.values()) {
      if (query.patient && conn.patient.toString() === query.patient.toString()) {
        if (!query.status || conn.status === query.status) {
          results.push(conn);
        }
      }
    }
    return {
      select: () => Promise.resolve(results),
    };
  };

  DoctorNote.create = (doc) => {
    const newDoc = {
      _id: new mongoose.Types.ObjectId(),
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    newDoc.save = () => {
      newDoc.updatedAt = new Date();
      return Promise.resolve(newDoc);
    };
    newDoc.deleteOne = () => {
      const idx = mockNotes.findIndex((n) => n._id.equals(newDoc._id));
      if (idx !== -1) mockNotes.splice(idx, 1);
      return Promise.resolve();
    };
    mockNotes.push(newDoc);
    return Promise.resolve(newDoc);
  };

  DoctorNote.find = (query) => {
    let filtered = [...mockNotes];
    if (query.doctor) {
      if (query.doctor.$in) {
        const docIds = query.doctor.$in.map((id) => id.toString());
        filtered = filtered.filter((n) => docIds.includes(n.doctor.toString()));
      } else {
        filtered = filtered.filter((n) => n.doctor.toString() === query.doctor.toString());
      }
    }
    if (query.patient) {
      filtered = filtered.filter((n) => n.patient.toString() === query.patient.toString());
    }
    if (query.type) {
      filtered = filtered.filter((n) => n.type === query.type);
    }
    if (query.visibility) {
      filtered = filtered.filter((n) => n.visibility === query.visibility);
    }
    if (query.priority) {
      filtered = filtered.filter((n) => n.priority === query.priority);
    }

    return {
      sort: () => ({
        skip: (s) => ({
          limit: (l) => ({
            populate: () => ({
              lean: () => {
                const slice = filtered.slice(s, s + l);
                return Promise.resolve(
                  slice.map((item) => ({
                    ...item,
                    doctor: mockUsers.get(item.doctor.toString()),
                  }))
                );
              },
            }),
            lean: () => Promise.resolve(filtered.slice(s, s + l)),
          }),
        }),
      }),
    };
  };

  DoctorNote.countDocuments = (query) => {
    let count = 0;
    for (const n of mockNotes) {
      let matches = true;
      if (query.doctor && n.doctor.toString() !== query.doctor.toString()) matches = false;
      if (query.patient && n.patient.toString() !== query.patient.toString()) matches = false;
      if (query.type && n.type !== query.type) matches = false;
      if (query.visibility && n.visibility !== query.visibility) matches = false;
      if (query.priority && n.priority !== query.priority) matches = false;
      if (matches) count++;
    }
    return Promise.resolve(count);
  };

  DoctorNote.findOne = (query) => {
    const note = mockNotes.find((n) => {
      let match = true;
      if (query._id && !n._id.equals(query._id)) match = false;
      if (query.patient && n.patient.toString() !== query.patient.toString()) match = false;
      if (query.doctor && n.doctor.toString() !== query.doctor.toString()) match = false;
      return match;
    });
    if (!note) return { lean: () => Promise.resolve(null), then: (fn) => fn(null) };
    return {
      ...note,
      lean: () => Promise.resolve(note),
      save: note.save,
      deleteOne: note.deleteOne,
    };
  };

  notificationService.createNotification = (notif) => {
    mockNotifications.push(notif);
    return Promise.resolve({ notification: notif, created: true });
  };

  // -------------------------------------------------------------
  // Test 1: Doctor can create private clinical note
  // -------------------------------------------------------------
  try {
    const note1 = await doctorNoteService.createDoctorNote({
      doctorId: doctorIdA.toString(),
      patientId: patientIdA.toString(),
      type: 'note',
      title: 'Confidential ECG Impression',
      content: 'Patient shows sinus rhythm with occasional PACs. Monitor without intervention.',
      visibility: 'doctor_private',
      priority: 'normal',
    });
    assertTest('Test 1: Doctor can create private clinical note', note1 && note1.visibility === 'doctor_private');
  } catch (err) {
    assertTest('Test 1: Doctor can create private clinical note', false);
  }

  // -------------------------------------------------------------
  // Test 2: Doctor can create patient-visible recommendation
  // -------------------------------------------------------------
  let recNote = null;
  try {
    recNote = await doctorNoteService.createDoctorNote({
      doctorId: doctorIdA.toString(),
      patientId: patientIdA.toString(),
      type: 'recommendation',
      title: 'Daily Hydration and Salt Reduction',
      content: 'Aim for 2.5L of water daily and keep sodium intake under 2000mg.',
      visibility: 'patient_visible',
      priority: 'important',
    });
    assertTest('Test 2: Doctor can create patient-visible recommendation', recNote && recNote.visibility === 'patient_visible' && recNote.type === 'recommendation');
  } catch (err) {
    assertTest('Test 2: Doctor can create patient-visible recommendation', false);
  }

  // -------------------------------------------------------------
  // Test 3: Unconnected doctor cannot create notes (403)
  // -------------------------------------------------------------
  try {
    await doctorNoteService.createDoctorNote({
      doctorId: unconnectedDoctorId.toString(),
      patientId: patientIdA.toString(),
      type: 'note',
      content: 'Unauthorized note attempt',
    });
    assertTest('Test 3: Unconnected doctor cannot create notes', false);
  } catch (err) {
    assertTest('Test 3: Unconnected doctor cannot create notes', err.statusCode === 403);
  }

  // -------------------------------------------------------------
  // Test 4: Revoked connection blocks access immediately (403)
  // -------------------------------------------------------------
  try {
    await doctorNoteService.createDoctorNote({
      doctorId: doctorIdA.toString(),
      patientId: patientIdB.toString(), // Connection is revoked
      type: 'note',
      content: 'Should be rejected due to revoked connection',
    });
    assertTest('Test 4: Revoked connection blocks access', false);
  } catch (err) {
    assertTest('Test 4: Revoked connection blocks access', err.statusCode === 403 && err.message.includes('revoked'));
  }

  // -------------------------------------------------------------
  // Test 5: Disabled notes permission blocks access (403)
  // -------------------------------------------------------------
  try {
    await doctorNoteService.createDoctorNote({
      doctorId: doctorIdB.toString(),
      patientId: patientIdB.toString(), // notes: false
      type: 'note',
      content: 'Should be rejected due to notes: false',
    });
    assertTest('Test 5: Disabled notes permission blocks access', false);
  } catch (err) {
    assertTest('Test 5: Disabled notes permission blocks access', err.statusCode === 403 && err.message.includes('disabled'));
  }

  // -------------------------------------------------------------
  // Test 6: Doctor A cannot access Doctor B's private notes
  // -------------------------------------------------------------
  let docBNote = null;
  try {
    docBNote = await doctorNoteService.createDoctorNote({
      doctorId: doctorIdB.toString(),
      patientId: patientIdA.toString(),
      type: 'note',
      title: "Dr. Bob's private observation",
      content: 'Private clinical note from Dr. Bob.',
      visibility: 'doctor_private',
    });

    await doctorNoteService.getDoctorNoteById({
      doctorId: doctorIdA.toString(), // Doctor A attempting to read Doctor B's note
      patientId: patientIdA.toString(),
      noteId: docBNote._id.toString(),
    });
    assertTest("Test 6: Doctor A cannot access Doctor B's private notes", false);
  } catch (err) {
    assertTest("Test 6: Doctor A cannot access Doctor B's private notes", err.statusCode === 403);
  }

  // -------------------------------------------------------------
  // Test 7: Doctor A cannot edit Doctor B's note
  // -------------------------------------------------------------
  try {
    await doctorNoteService.updateDoctorNote({
      doctorId: doctorIdA.toString(), // Doctor A
      patientId: patientIdA.toString(),
      noteId: docBNote._id.toString(), // Belongs to Doctor B
      updateData: { content: 'Hacked note content' },
    });
    assertTest("Test 7: Doctor A cannot edit Doctor B's note", false);
  } catch (err) {
    assertTest("Test 7: Doctor A cannot edit Doctor B's note", err.statusCode === 403);
  }

  // -------------------------------------------------------------
  // Test 8: Doctor A cannot delete Doctor B's note
  // -------------------------------------------------------------
  try {
    await doctorNoteService.deleteDoctorNote({
      doctorId: doctorIdA.toString(), // Doctor A
      patientId: patientIdA.toString(),
      noteId: docBNote._id.toString(), // Belongs to Doctor B
    });
    assertTest("Test 8: Doctor A cannot delete Doctor B's note", false);
  } catch (err) {
    assertTest("Test 8: Doctor A cannot delete Doctor B's note", err.statusCode === 403);
  }

  // -------------------------------------------------------------
  // Test 9: Patient cannot see private notes
  // -------------------------------------------------------------
  try {
    const patientRecs = await doctorNoteService.getPatientRecommendations({
      patientId: patientIdA.toString(),
    });
    const hasPrivateNote = patientRecs.recommendations.some(
      (r) => r.visibility === 'doctor_private' || r.type !== 'recommendation'
    );
    assertTest('Test 9: Patient cannot see private notes', !hasPrivateNote && patientRecs.recommendations.length > 0);
  } catch (err) {
    assertTest('Test 9: Patient cannot see private notes', false);
  }

  // -------------------------------------------------------------
  // Test 10: Patient can see published recommendations
  // -------------------------------------------------------------
  try {
    const patientRecs = await doctorNoteService.getPatientRecommendations({
      patientId: patientIdA.toString(),
    });
    const recFound = patientRecs.recommendations.find(
      (r) => r._id.equals(recNote._id) && r.visibility === 'patient_visible'
    );
    assertTest('Test 10: Patient can see published recommendations', !!recFound && recFound.doctor.specialization === 'Cardiology');
  } catch (err) {
    assertTest('Test 10: Patient can see published recommendations', false);
  }

  // -------------------------------------------------------------
  // Test 11: Patient cannot see another patient's recommendations
  // -------------------------------------------------------------
  try {
    const patientBRecs = await doctorNoteService.getPatientRecommendations({
      patientId: patientIdB.toString(), // Patient B
    });
    const leakFound = patientBRecs.recommendations.some((r) => r.patient.toString() === patientIdA.toString());
    assertTest("Test 11: Patient cannot see another patient's recommendations", !leakFound);
  } catch (err) {
    assertTest("Test 11: Patient cannot see another patient's recommendations", false);
  }

  // -------------------------------------------------------------
  // Test 12: Invalid IDs cannot be manipulated (validation rejects with 400)
  // -------------------------------------------------------------
  try {
    await doctorNoteService.getDoctorNoteById({
      doctorId: doctorIdA.toString(),
      patientId: patientIdA.toString(),
      noteId: 'invalid-id-12345',
    });
    assertTest('Test 12: Invalid ObjectId rejected', false);
  } catch (err) {
    assertTest('Test 12: Invalid ObjectId rejected', err.statusCode === 400);
  }

  // -------------------------------------------------------------
  // Test 13: XSS and malicious HTML markup are rejected
  // -------------------------------------------------------------
  const xssReq = {
    params: { patientId: patientIdA.toString() },
    body: {
      title: 'Legitimate Title',
      content: '<script>alert("XSS Attack!");</script> Take medicine now',
    },
    query: {},
  };
  const xssValidationResult = await runValidator(createDoctorNoteValidator, xssReq);
  const hasXssError = xssValidationResult.array().some((e) => e.msg.includes('Arbitrary HTML or executable scripts'));
  assertTest('Test 13: XSS / executable script tags rejected', hasXssError);

  // -------------------------------------------------------------
  // Test 14: Notification is created for patient-visible recommendation
  // -------------------------------------------------------------
  const recommendationNotification = mockNotifications.find(
    (n) => n.user.toString() === patientIdA.toString() && n.type === 'doctor_recommendation'
  );
  assertTest(
    'Test 14: Notification generated for recommendation without exposing private content',
    !!recommendationNotification &&
      recommendationNotification.title === 'New doctor recommendation' &&
      !recommendationNotification.message.includes('sinus rhythm')
  );

  // -------------------------------------------------------------
  // Test 15: Doctor note pagination and priority filtering
  // -------------------------------------------------------------
  try {
    const listRes = await doctorNoteService.getDoctorNotes({
      doctorId: doctorIdA.toString(),
      patientId: patientIdA.toString(),
      priority: 'important',
    });
    assertTest(
      'Test 15: Doctor note filtering and pagination work properly',
      listRes.notes.length === 1 && listRes.pagination.total === 1
    );
  } catch (err) {
    assertTest('Test 15: Doctor note filtering and pagination work properly', false);
  }

  console.log('===============================================================');
  console.log(`Step 22 Test Results: ${passed} passed, ${failed} failed out of ${passed + failed}`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDoctorNoteTests().catch((err) => {
  console.error('Test execution encountered unhandled error:', err);
  process.exit(1);
});
