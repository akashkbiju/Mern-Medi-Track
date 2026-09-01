import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * General API rate limiter for standard endpoints
 * Allows 200 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(
      new ApiResponse(
        false,
        'Too many requests from this IP address, please try again after 15 minutes'
      )
    );
  },
});

/**
 * Stricter rate limiter designed for future auth endpoints (login, register, reset-password)
 * Allows 20 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(
      new ApiResponse(
        false,
        'Too many authentication attempts. Please try again after 15 minutes for security reasons.'
      )
    );
  },
});

export default { apiLimiter, authLimiter };
