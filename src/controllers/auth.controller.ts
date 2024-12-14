import { Request, Response } from 'express';
import logger from '../services/logger.service';
import {
  GoogleAuthType,
  SendEmailRegisterType,
  RegisterType,
  VerifyEmailType,
  SendEmailResetPasswordType,
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

export const sendEmailRegister = async (request: Request, response: Response) => {
  logger.start(request);
  const { email }: SendEmailRegisterType = request.body;
  const result = await authLocalService.sendEmailRegister(email);
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

export const sendEmailResetPassword = async (request: Request, response: Response) => {
  logger.start(request);
  const { email }: SendEmailResetPasswordType = request.body;
  const result = await authLocalService.sendEmailResetPassword(email);
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
  sendEmailRegister,
  verifyEmail,
  register,
  sendEmailResetPassword,
  resetPassword,
};
