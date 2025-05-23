import type { Request } from 'express';
import { UserAuthType, UserType } from './users.type';
import { EMAIL_VERIFICATION_ACTION_TYPE } from '../enums/prisma.enum';

export type AuthRequest = Request & {
  user?: UserType;
};

export type LocalAuthType = {
  email: string;
  password: string;
};

export type AuthValidateType = {
  token: string;
};

export type GoogleAuthType = {
  idToken: string;
};

export type GoogleLinkAccountParamType = {
  id: string;
};

export type GoogleLinkAccountBodyType = {
  providerUserId: string;
  providerEmail: string;
};

export type GoogleUnlinkAccountParamType = {
  id: string;
};

export type SendEmailRegisterType = {
  email: string;
};

export type AuthResponseType = {
  user: UserAuthType;
  accessToken: string;
  isFirstTimeLogin: boolean;
};

export type VerifyEmailType = {
  token: string;
  type: EMAIL_VERIFICATION_ACTION_TYPE;
};

export type VerifyEmailResponseType = {
  token: string;
  userId: string;
};

export type PayloadAccessTokenType = {
  id: string;
  firstname: string;
  lastname: string;
};

export type PayloadTokenVerifyEmailType = {
  id: string;
  token: string;
  email?: string;
};

export type AuthValidateResponseType = {
  user: PayloadAccessTokenType;
};

export type RegisterType = {
  userId: string;
  password: string;
  confirmPassword: string;
  userPolicy: string[];
  firstname: string;
  lastname: string;
  username: string;
};

export type SendEmailResetPasswordType = {
  email: string;
};

export type ResetPasswordParamType = {
  id: string;
};

export type ResetPasswordBodyType = {
  password: string;
  confirmPassword: string;
};

export type ResetPasswordResponseType = {
  user: UserType;
};

export type GetAuthProviderParamType = {
  userId: string;
};
