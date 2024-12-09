import { Request, Response } from 'express';
import logger from '../services/logger.service';
import {
  GoogleAuthType,
  VerifyEmailExistType,
  RegisterType,
  VerifyEmailType,
  VerifyEmailResetPasswordType,
  ResetPasswordType,
} from '../types/auth.type';
import { authGoogleService, authLocalService } from '../services';

export const googleAuth = async (request: Request, response: Response) => {
  logger.start(request);
  const { idToken }: GoogleAuthType = request.body;
  const result = await authGoogleService.login(idToken);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const verifyEmailExist = async (request: Request, response: Response) => {
  logger.start(request);
  const { email }: VerifyEmailExistType = request.body;
  const result = await authLocalService.verifyEmailExist(email);
  response.status(result.status).send(result.data);

  logger.end(request);
};

export const verifyEmail = async (request: Request, response: Response) => {
  logger.start(request);
  const { token, type }: VerifyEmailType = request.body;
  const result = await authLocalService.verifyEmail(token, type);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const register = async (request: Request, response: Response) => {
  logger.start(request);
  const { userId, password, confirmPassword, userPolicy, name, username } =
    request.body as RegisterType;
  const result = await authLocalService.register({
    userId,
    password,
    confirmPassword,
    userPolicy,
    name,
    username,
  });
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const verifyEmailResetPassword = async (request: Request, response: Response) => {
  logger.start(request);
  const { email }: VerifyEmailResetPasswordType = request.body;
  const result = await authLocalService.verifyEmailResetPassword(email);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const resetPassword = async (request: Request, response: Response) => {
  logger.start(request);
  const { userId, password, confirmPassword }: ResetPasswordType = request.body;
  const result = await authLocalService.resetPassword({ userId, password, confirmPassword });
  response.status(result.status).send(result.data);
  logger.end(request);
};

export default {
  googleAuth,
  verifyEmailExist,
  verifyEmail,
  register,
  verifyEmailResetPassword,
  resetPassword,
};
