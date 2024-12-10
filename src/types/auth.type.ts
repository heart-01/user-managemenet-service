import { Request } from 'express';
import { UserType } from './users.type';
import { ACTION_TYPE } from '../config/database';

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
  type: ACTION_TYPE;
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

export type VerifyEmailResetPasswordType = {
  email: string;
};

export type PayloadTokenResetPasswordType = {
  id: string;
  token: string;
};

export type ResetPasswordType = {
  userId: string;
  password: string;
  confirmPassword: string;
};

export type ResetPasswordResponseType = {
  user: UserType;
};
