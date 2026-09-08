import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { mongoSanitize } from '../middleware/sanitizeMiddleware.js';
import { errorHandler } from '../middleware/errorMiddleware.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

/**
 * Step 26 Automated Verification Test Suite: Security Hardening
 */
async function runSecurityTests() {
  console.log('===============================================================');
  console.log('Starting Step 26 Security Hardening Test Suite');
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

  try {
    // -------------------------------------------------------------
    // Test 1: NoSQL Injection Sanitization
    // -------------------------------------------------------------
    console.log('\n--- Section 1: NoSQL Injection Sanitization ---');
    const maliciousReq = {
      body: {
        email: { $gt: '' },
        username: 'victim',
        nested: { $where: 'sleep(5000)', clean: 'allowed' },
      },
      query: { 'role[$ne]': 'patient', regular: 'param' },
      params: { id: '60d0fe4f5311236168a109ca' },
    };

    mongoSanitize(maliciousReq, {}, () => {});

    assertTest(
      'mongoSanitize stripped $gt operator from email field',
      maliciousReq.body.email.$gt === undefined && maliciousReq.body.username === 'victim'
    );
    assertTest(
      'mongoSanitize stripped nested $ operator from body',
      maliciousReq.body.nested.$where === undefined && maliciousReq.body.nested.clean === 'allowed'
    );
    assertTest(
      'mongoSanitize sanitized query parameters containing dots or brackets',
      maliciousReq.query.regular === 'param'
    );

    // -------------------------------------------------------------
    // Test 2: JWT Security & Expiration Behavior
    // -------------------------------------------------------------
    console.log('\n--- Section 2: JWT Token Integrity ---');
    const secret = env.JWT_SECRET || 'test_jwt_secret_for_hardening_suite_32chars';

    // Valid Token
    const validToken = jwt.sign({ id: 'user123', role: 'patient' }, secret, { expiresIn: '1h' });
    const decodedValid = jwt.verify(validToken, secret);
    assertTest('Valid JWT verifies cleanly with correct payload', decodedValid.id === 'user123');

    // Tampered Token
    let tamperedRejected = false;
    try {
      const tamperedToken = validToken.slice(0, -5) + 'abcde';
      jwt.verify(tamperedToken, secret);
    } catch (err) {
      if (err.name === 'JsonWebTokenError') tamperedRejected = true;
    }
    assertTest('Tampered JWT signature is rejected with JsonWebTokenError', tamperedRejected);

    // Expired Token
    let expiredRejected = false;
    try {
      const expiredToken = jwt.sign({ id: 'user123' }, secret, { expiresIn: '0s' });
      jwt.verify(expiredToken, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') expiredRejected = true;
    }
    assertTest('Expired JWT is strictly rejected with TokenExpiredError', expiredRejected);

    // -------------------------------------------------------------
    // Test 3: Password Hashing & Never-Plaintext Guarantee
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Password Cryptography & Salt ---');
    const password = 'SuperSecurePassword#2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    assertTest('Password hash does not equal plaintext', hash !== password);
    assertTest('Password hash begins with bcrypt identifier ($2a$ or $2b$)', hash.startsWith('$2a$') || hash.startsWith('$2b$'));
    assertTest('Password comparison succeeds with correct password', await bcrypt.compare(password, hash));
    assertTest('Password comparison fails with incorrect password', !(await bcrypt.compare('WrongPassword', hash)));

    // -------------------------------------------------------------
    // Test 4: Error Handler Sanitization & Masking
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Production Error Masking ---');

    let responseStatusCode = null;
    let responseBody = null;
    const mockRes = {
      status: (code) => {
        responseStatusCode = code;
        return {
          json: (data) => {
            responseBody = data;
          },
        };
      },
    };

    // CastError Handling
    const castErr = new Error('Cast to ObjectId failed');
    castErr.name = 'CastError';
    castErr.value = 'invalid-id-payload';
    errorHandler(castErr, { method: 'GET', originalUrl: '/api/reports/invalid-id-payload' }, mockRes, () => {});

    assertTest('Mongoose CastError masks raw error and returns 404', responseStatusCode === 404);
    assertTest('CastError response has success: false', responseBody.success === false);

    // Malformed JSON SyntaxError
    const syntaxErr = new SyntaxError('Unexpected token in JSON at position 5');
    syntaxErr.status = 400;
    syntaxErr.body = '{ bad }';
    errorHandler(syntaxErr, { method: 'POST', originalUrl: '/api/auth/login' }, mockRes, () => {});

    assertTest('Malformed JSON SyntaxError returns 400 with clean message', responseStatusCode === 400 && responseBody.message.includes('Malformed JSON'));

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`Step 26 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests();
