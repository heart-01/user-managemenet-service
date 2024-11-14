import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

const env = process.env.NODE_ENV || 'development';
let envFile = '';

if (env === 'production') {
  envFile = '.env.prod';
} else if (env === 'test') {
  envFile = '.env.test';
} else {
  envFile = '.env.dev';
}

dotenvExpand.expand(dotenv.config({ path: envFile }));

export const NODE_ENV = process.env.NODE_ENV || '';
export const PORT = process.env.PORT || 3000;
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
export const JWT_SECRET = process.env.JWT_SECRET || '';
export const JWT_ISSUER = process.env.JWT_ISSUER || '';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || '';
export const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '7d';
