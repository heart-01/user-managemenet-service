import { Request } from 'express';
import { UserType } from './users.type';

export type AuthRequest = Request & {
  user?: UserType;
};

export type GoogleAuthType = {
  idToken: string;
};

export type VerifyEmailExistType = {
  email: string;
};

export type AuthResponseType = {
  user: UserType;
  accessToken: string;
  isFirstTimeLogin: boolean;
};

export type VerifyEmailType = {
  token: string;
};

export type VerifyEmailResponseType = {
  token: string;
  userId: string;
};

export type PayloadTokenVerifyEmailType = {
  id: string;
  token: string;
};

export type RegisterType = {
  userId: string;
  password: string;
  confirmPassword: string;
  userPolicy: Array<string>;
  name: string;
  username: string;
};
