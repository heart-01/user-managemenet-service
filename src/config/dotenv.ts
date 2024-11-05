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
export const PORT = process.env.PORT || 3030;
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
