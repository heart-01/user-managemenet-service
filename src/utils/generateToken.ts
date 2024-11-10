import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { JWT_AUDIENCE, JWT_ISSUER } from '../config/dotenv';

const defaultOptions: SignOptions = {
  algorithm: 'HS256',
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
};

const generateToken = (
  payload: object,
  secret: Secret,
  expiresIn: SignOptions['expiresIn'],
): string =>
  jwt.sign(payload, secret, {
    expiresIn,
    ...defaultOptions,
  });

export default generateToken;
