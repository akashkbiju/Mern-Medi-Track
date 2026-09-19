import { env } from '../config/env.js';

/**
 * Structured, lightweight logger with timestamps and sanitization against sensitive health/auth fields
 */
const sanitizeMessage = (message) => {
  if (typeof message !== 'string') {
    try {
      message = JSON.stringify(message);
    } catch {
      message = String(message);
    }
  }

  // Sanitize passwords, tokens, mongodb uri strings
  return message
    .replace(/(password["']?\s*[:=]\s*["']?)([^"',\s]+)/gi, '$1***')
    .replace(/(token["']?\s*[:=]\s*["']?)([^"',\s]+)/gi, '$1***')
    .replace(/(mongodb(\+srv)?:\/\/[^:]+:)([^@]+)@/gi, '$1***@');
};

const formatTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, ...args) => {
    console.log(`[${formatTimestamp()}] [INFO]: ${sanitizeMessage(message)}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[${formatTimestamp()}] [WARN]: ${sanitizeMessage(message)}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[${formatTimestamp()}] [ERROR]: ${sanitizeMessage(message)}`, ...args);
  },
  debug: (message, ...args) => {
    if (env.isDevelopment) {
      console.debug(`[${formatTimestamp()}] [DEBUG]: ${sanitizeMessage(message)}`, ...args);
    }
  },
};

export default logger;
