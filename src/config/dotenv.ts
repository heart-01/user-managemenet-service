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
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
export const TIMEZONE = process.env.TIMEZONE || 'Asia/Bangkok';

export const IPINFO_BASE_URL = process.env.IPINFO_BASE_URL || 'https://ipinfo.io';
export const IPINFO_API_KEY = process.env.IPINFO_API_KEY || '';
export const USER_ACTIVITY_ATTEMPT_LOGIN_LIMIT = process.env.USER_ACTIVITY_ATTEMPT_LOGIN_LIMIT || 5;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

export const JWT_SECRET = process.env.JWT_SECRET || '';
export const JWT_ISSUER = process.env.JWT_ISSUER || '';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || '';
export const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '7d';

export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
export const SENDGRID_SENDER_EMAIL = process.env.SENDGRID_SENDER_EMAIL || '';
export const SENDGRID_TEMPLATE_VERIFY_EMAIL = process.env.SENDGRID_TEMPLATE_VERIFY_EMAIL || '';
export const SENDGRID_TEMPLATE_RESET_PASSWORD_EMAIL =
  process.env.SENDGRID_TEMPLATE_RESET_PASSWORD_EMAIL || '';
export const SENDGRID_TEMPLATE_CHANGE_PASSWORD_EMAIL =
  process.env.SENDGRID_TEMPLATE_CHANGE_PASSWORD_EMAIL || '';
export const SENDGRID_TEMPLATE_LOGIN_DEVICE_EMAIL =
  process.env.SENDGRID_TEMPLATE_LOGIN_DEVICE_EMAIL || '';
