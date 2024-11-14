import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CLIENT_ID } from './dotenv';

export const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
