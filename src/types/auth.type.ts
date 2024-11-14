import { Request } from 'express';
import { UserType } from './users.type';

export interface AuthRequest extends Request {
  user?: UserType;
}

export type googleAuthType = {
  idToken: string;
};

export type AuthResponseType = {
  user: UserType;
  accessToken: string;
  isFirstTimeLogin: boolean;
};
