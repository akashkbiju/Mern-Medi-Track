import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

// Validate environment variables on startup
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(
    `[ENV WARNING] Missing critical environment variables: ${missingVars.join(
      ', '
    )}. Please check your .env configuration.`
  );
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'meditrack_default_jwt_secret_dev',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

export default env;
