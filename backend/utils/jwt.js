import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate a signed JWT for an authenticated user
 * Contains only minimal non-sensitive identity & authorization fields (id, role)
 *
 * @param {Object} user - User document or object with _id/id and role
 * @returns {string} - Signed JWT token
 */
export const generateToken = (user) => {
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Verify and decode an incoming JWT token
 *
 * @param {string} token - JWT string
 * @returns {Object} - Decoded token payload
 * @throws {jwt.JsonWebTokenError | jwt.TokenExpiredError}
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

export default { generateToken, verifyToken };
