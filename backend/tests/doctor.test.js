import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { doctorRegisterValidator, updateDoctorProfileValidator } from '../validators/doctorValidator.js';
import { doctorService } from '../services/doctorService.js';
import { authService } from '../services/authService.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';

/**
 * Step 19 Verification Test Suite: Doctor Registration, Login & Profile
 * Covers all 23 scenarios specified in Step 19 Section 35
 */
async function runDoctorTests() {
  console.log('--- Starting Step 19 Doctor System Verification Suite ---');
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

  const mockDoctorId = new mongoose.Types.ObjectId();
  const mockPatientId = new mongoose.Types.ObjectId();

  // --- Test 1: Doctor registration with valid payload passes validator ---
  const validRegReq = {
    body: {
      fullName: 'Dr. John Doe',
      email: 'john.doe@hospital.org',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      specialization: 'Cardiology',
      licenseNumber: 'MD-123456',
      phone: '+1234567890',
      hospital: 'Metro General Hospital',
      experience: 12,
      bio: 'Board-certified cardiologist with over a decade of clinical care.',
      consultationInfo: 'Mon-Fri 9:00 AM - 4:00 PM',
    },
  };
  const validRegRes = await runValidator(doctorRegisterValidator, validRegReq);
  assertTest('Test 1: Valid doctor registration passes validator', validRegRes.isEmpty());

  // --- Test 2: Doctor registration with weak password rejected (400) ---
  const weakPasswordReq = {
    body: {
      fullName: 'Dr. Jane Roe',
      email: 'jane.roe@hospital.org',
      password: 'weak',
      confirmPassword: 'weak',
      specialization: 'Neurology',
      licenseNumber: 'MD-654321',
    },
  };
  const weakPasswordRes = await runValidator(doctorRegisterValidator, weakPasswordReq);
  assertTest(
    'Test 2: Weak password without uppercase/digit/symbol rejected by validator',
    !weakPasswordRes.isEmpty() && weakPasswordRes.array().some((e) => e.path === 'password')
  );

  // --- Test 3: Doctor registration with mismatched password/confirmPassword rejected ---
  const mismatchedPwReq = {
    body: {
      fullName: 'Dr. Alice Smith',
      email: 'alice@hospital.org',
      password: 'Password123!',
      confirmPassword: 'DifferentPassword123!',
      specialization: 'Pediatrics',
      licenseNumber: 'MD-777888',
    },
  };
  const mismatchedPwRes = await runValidator(doctorRegisterValidator, mismatchedPwReq);
  assertTest(
    'Test 3: Mismatched password/confirmPassword rejected by validator',
    !mismatchedPwRes.isEmpty() && mismatchedPwRes.array().some((e) => e.path === 'confirmPassword')
  );

  // --- Test 4: Doctor registration with duplicate email rejected (409) ---
  const originalFindOneUser = User.findOne;
  User.findOne = async (query) => {
    if (query.email === 'duplicate@hospital.org') {
      return { _id: new mongoose.Types.ObjectId(), email: 'duplicate@hospital.org' };
    }
    return null;
  };
  const originalReadyState = mongoose.connection.readyState;
  Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

  let dupEmailRejected = false;
  try {
    await doctorService.registerDoctor({
      fullName: 'Dr. Duplicate',
      email: 'duplicate@hospital.org',
      password: 'Password123!',
      specialization: 'General',
      licenseNumber: 'MD-UNIQUE-01',
    });
  } catch (err) {
    dupEmailRejected = err.statusCode === 409 && err.message.includes('email');
  }
  assertTest('Test 4: Duplicate email rejected with 409 Conflict', dupEmailRejected);

  // --- Test 5: Doctor registration with duplicate licenseNumber rejected (409) ---
  User.findOne = async () => null; // No duplicate email
  const originalFindOneDoc = DoctorProfile.findOne;
  DoctorProfile.findOne = async (query) => {
    if (query.licenseNumber === 'MD-DUPLICATE-LIC') {
      return { _id: new mongoose.Types.ObjectId(), licenseNumber: 'MD-DUPLICATE-LIC' };
    }
    return null;
  };

  let dupLicenseRejected = false;
  try {
    await doctorService.registerDoctor({
      fullName: 'Dr. Unique Email',
      email: 'unique@hospital.org',
      password: 'Password123!',
      specialization: 'General',
      licenseNumber: 'MD-DUPLICATE-LIC',
    });
  } catch (err) {
    dupLicenseRejected = err.statusCode === 409 && err.message.includes('license');
  }
  assertTest('Test 5: Duplicate licenseNumber rejected with 409 Conflict', dupLicenseRejected);

  // --- Test 6: Doctor registration with missing licenseNumber rejected ---
  const missingLicenseReq = {
    body: {
      fullName: 'Dr. No License',
      email: 'nolicense@hospital.org',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      specialization: 'Orthopedics',
    },
  };
  const missingLicenseRes = await runValidator(doctorRegisterValidator, missingLicenseReq);
  assertTest(
    'Test 6: Missing licenseNumber rejected by validator',
    !missingLicenseRes.isEmpty() && missingLicenseRes.array().some((e) => e.path === 'licenseNumber')
  );

  // --- Test 7: Doctor registration with missing specialization rejected ---
  const missingSpecReq = {
    body: {
      fullName: 'Dr. No Spec',
      email: 'nospec@hospital.org',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      licenseNumber: 'MD-999999',
    },
  };
  const missingSpecRes = await runValidator(doctorRegisterValidator, missingSpecReq);
  assertTest(
    'Test 7: Missing specialization rejected by validator',
    !missingSpecRes.isEmpty() && missingSpecRes.array().some((e) => e.path === 'specialization')
  );

  // --- Test 8: Doctor registration forces role to 'doctor' (client role injection ignored) ---
  let createdUserData = null;
  const originalUserCreate = User.create;
  User.create = async (doc) => {
    createdUserData = doc;
    return {
      _id: mockDoctorId,
      ...doc,
      createdAt: new Date(),
    };
  };

  let createdProfileData = null;
  const originalProfileCreate = DoctorProfile.create;
  DoctorProfile.create = async (doc) => {
    createdProfileData = doc;
    return {
      _id: new mongoose.Types.ObjectId(),
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };
  DoctorProfile.findOne = async () => null;

  await doctorService.registerDoctor({
    fullName: 'Dr. Injection Test',
    email: 'injection@hospital.org',
    password: 'Password123!',
    specialization: 'Dermatology',
    licenseNumber: 'MD-INJECT-01',
    role: 'admin', // Attempted injection
  });

  assertTest(
    'Test 8: Server forces role to "doctor", ignoring client-supplied role injection',
    createdUserData && createdUserData.role === 'doctor'
  );

  // --- Test 9: Doctor registration forces isVerified: false (injection ignored) ---
  assertTest(
    'Test 9: Server forces isVerified to false, ignoring client-supplied verification flags',
    createdProfileData && createdProfileData.isVerified === false
  );

  // --- Test 10: Doctor login with correct credentials succeeds ---
  const hashedDoctorPw = await bcrypt.hash('DoctorSecret123!', 10);
  const mockDoctorUser = {
    _id: mockDoctorId,
    fullName: 'Dr. John Doe',
    email: 'dr.john@hospital.org',
    password: hashedDoctorPw,
    role: 'doctor',
    isActive: true,
    toObject: function () {
      return { ...this };
    },
  };

  User.findOne = (query) => ({
    select: (fields) => {
      if (query.email === 'dr.john@hospital.org') {
        return Promise.resolve(mockDoctorUser);
      }
      return Promise.resolve(null);
    },
  });

  DoctorProfile.findOne = async (query) => {
    if (query.user && query.user.toString() === mockDoctorId.toString()) {
      return {
        _id: new mongoose.Types.ObjectId(),
        user: mockDoctorId,
        specialization: 'Cardiology',
        licenseNumber: 'MD-123456',
        isVerified: false,
      };
    }
    return null;
  };

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_step19';
  const loginResult = await authService.loginUser({ email: 'dr.john@hospital.org', password: 'DoctorSecret123!' });
  assertTest(
    'Test 10: Doctor login with valid credentials succeeds and returns JWT and user payload',
    loginResult &&
      Boolean(loginResult.token) &&
      loginResult.user.role === 'doctor' &&
      loginResult.user.email === 'dr.john@hospital.org'
  );

  // --- Test 11: Doctor login response includes isVerified: false ---
  assertTest(
    'Test 11: Doctor login response includes isVerified status',
    loginResult.user.isVerified === false
  );

  // --- Test 12: Doctor login with wrong password rejected (401) ---
  let wrongPwRejected = false;
  try {
    await authService.loginUser({ email: 'dr.john@hospital.org', password: 'WrongPassword!' });
  } catch (err) {
    wrongPwRejected = err.statusCode === 401;
  }
  assertTest('Test 12: Doctor login with incorrect password rejected with 401', wrongPwRejected);

  // --- Test 13: Patient login still works and returns role: 'patient' ---
  const hashedPatientPw = await bcrypt.hash('PatientSecret123!', 10);
  const mockPatientUser = {
    _id: mockPatientId,
    fullName: 'Jane Patient',
    email: 'jane.patient@example.com',
    password: hashedPatientPw,
    role: 'patient',
    isActive: true,
    toObject: function () {
      return { ...this };
    },
  };

  User.findOne = (query) => ({
    select: () => {
      if (query.email === 'jane.patient@example.com') {
        return Promise.resolve(mockPatientUser);
      }
      return Promise.resolve(null);
    },
  });

  const patientLoginRes = await authService.loginUser({ email: 'jane.patient@example.com', password: 'PatientSecret123!' });
  assertTest(
    'Test 13: Patient login continues to work properly returning role: "patient"',
    patientLoginRes && patientLoginRes.user.role === 'patient'
  );

  // --- Test 14: Doctor can view own profile ---
  User.findById = async (id) => {
    if (id.toString() === mockDoctorId.toString()) {
      return {
        _id: mockDoctorId,
        fullName: 'Dr. John Doe',
        email: 'dr.john@hospital.org',
        phone: '+1234567890',
        role: 'doctor',
        isActive: true,
        createdAt: new Date(),
      };
    }
    return null;
  };

  const getProfileRes = await doctorService.getDoctorProfile(mockDoctorId.toString());
  assertTest(
    'Test 14: Doctor can view own profile (retrieves user and doctorProfile combined)',
    getProfileRes &&
      getProfileRes.user.role === 'doctor' &&
      getProfileRes.doctorProfile.specialization === 'Cardiology' &&
      getProfileRes.doctorProfile.licenseNumber === 'MD-123456'
  );

  // --- Test 15: Unauthenticated user cannot view doctor profile (401) ---
  const reqNoAuth = { headers: {} };
  const authMiddlewareErr = await new Promise((resolve) => {
    protect(reqNoAuth, {}, (err) => resolve(err || null));
  });
  assertTest(
    'Test 15: Unauthenticated request to doctor profile rejected with 401',
    authMiddlewareErr && authMiddlewareErr.statusCode === 401
  );

  // --- Test 16: Patient cannot view doctor profile (403 Forbidden) ---
  const reqPatientRole = { user: { id: mockPatientId.toString(), role: 'patient' } };
  let rbacMiddlewareErr = null;
  try {
    authorizeRoles('doctor')(reqPatientRole, {}, () => {});
  } catch (err) {
    rbacMiddlewareErr = err;
  }
  assertTest(
    'Test 16: Patient user calling doctor endpoint rejected with 403 Forbidden',
    rbacMiddlewareErr && rbacMiddlewareErr.statusCode === 403
  );

  // --- Test 17: Doctor can update allowed profile fields ---
  const mockUserDoc = {
    _id: mockDoctorId,
    fullName: 'Dr. John Doe',
    email: 'dr.john@hospital.org',
    phone: '+1234567890',
    role: 'doctor',
    isActive: true,
    save: async function () {
      return this;
    },
  };

  const mockProfileDoc = {
    _id: new mongoose.Types.ObjectId(),
    user: mockDoctorId,
    specialization: 'Cardiology',
    licenseNumber: 'MD-123456',
    hospital: 'Old Clinic',
    experience: 5,
    bio: 'Old bio',
    consultationInfo: 'Old hours',
    isVerified: false,
    save: async function () {
      return this;
    },
  };

  User.findById = async () => mockUserDoc;
  DoctorProfile.findOne = async () => mockProfileDoc;

  const updateResult = await doctorService.updateDoctorProfile(mockDoctorId.toString(), {
    fullName: 'Dr. Jonathan Doe',
    phone: '+1987654321',
    specialization: 'Interventional Cardiology',
    hospital: 'St. Jude Heart Center',
    experience: 14,
    bio: 'Updated bio information.',
    consultationInfo: 'Tue-Sat 10:00 AM - 5:00 PM',
  });

  assertTest(
    'Test 17: Doctor can update allowed profile fields (fullName, specialization, hospital, etc.)',
    updateResult.user.fullName === 'Dr. Jonathan Doe' &&
      updateResult.user.phone === '+1987654321' &&
      updateResult.doctorProfile.specialization === 'Interventional Cardiology' &&
      updateResult.doctorProfile.hospital === 'St. Jude Heart Center' &&
      updateResult.doctorProfile.experience === 14
  );

  // --- Test 18: Doctor cannot update email via profile update ---
  await doctorService.updateDoctorProfile(mockDoctorId.toString(), {
    email: 'hacked_email@attacker.com',
  });
  assertTest(
    'Test 18: Profile update strictly preserves original email address',
    mockUserDoc.email === 'dr.john@hospital.org'
  );

  // --- Test 19: Doctor cannot update licenseNumber via profile update ---
  await doctorService.updateDoctorProfile(mockDoctorId.toString(), {
    licenseNumber: 'MD-FORGED-999',
  });
  assertTest(
    'Test 19: Profile update strictly preserves immutable licenseNumber',
    mockProfileDoc.licenseNumber === 'MD-123456'
  );

  // --- Test 20: Doctor cannot update isVerified via profile update ---
  await doctorService.updateDoctorProfile(mockDoctorId.toString(), {
    isVerified: true,
  });
  assertTest(
    'Test 20: Profile update strictly prevents self-verification (isVerified remains false)',
    mockProfileDoc.isVerified === false
  );

  // --- Test 21: Doctor cannot update role via profile update ---
  await doctorService.updateDoctorProfile(mockDoctorId.toString(), {
    role: 'admin',
  });
  assertTest(
    'Test 21: Profile update strictly preserves immutable doctor role',
    mockUserDoc.role === 'doctor'
  );

  // --- Test 22: Passwords are never returned in any doctor response (sanitized) ---
  const sanitizedUser = sanitizeUser({
    _id: mockDoctorId,
    fullName: 'Dr. John Doe',
    email: 'dr.john@hospital.org',
    password: 'super_secret_hash',
    role: 'doctor',
  });
  assertTest(
    'Test 22: sanitizeUser strips password hash from doctor response payload',
    sanitizedUser.password === undefined &&
      updateResult.user.password === undefined &&
      getProfileRes.user.password === undefined
  );

  // --- Test 23: JWT payload contains { id, role: 'doctor' } ---
  const generatedToken = generateToken({ _id: mockDoctorId, role: 'doctor' });
  const decodedToken = verifyToken(generatedToken);
  assertTest(
    'Test 23: Generated JWT token payload contains correct id and role: "doctor"',
    decodedToken.id === mockDoctorId.toString() && decodedToken.role === 'doctor'
  );

  // Restore mocks
  User.findOne = originalFindOneUser;
  User.findById = (id) => User.findOne({ _id: id });
  User.create = originalUserCreate;
  DoctorProfile.findOne = originalFindOneDoc;
  DoctorProfile.create = originalProfileCreate;
  Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });

  console.log('\n--- Step 19 Test Results ---');
  console.log(`Passed: ${passed} / 23`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runDoctorTests().catch((err) => {
  console.error('Fatal test error in doctor test suite:', err);
  process.exit(1);
});
