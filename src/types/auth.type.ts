import { Request } from 'express';
import { UserType } from './users.type';

export type AuthRequest = Request & {
  user?: UserType;
};

export type googleAuthType = {
  idToken: string;
};

export type localRegisterType = {
  email: string;
};

export type AuthResponseType = {
  user: UserType;
  accessToken: string;
  isFirstTimeLogin: boolean;
};
