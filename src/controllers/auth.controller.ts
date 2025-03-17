import { Request, Response } from 'express';
import { jwtDecode } from 'jwt-decode';
import logger from '../services/logger.service';
import {
  GoogleAuthType,
  SendEmailRegisterType,
  RegisterType,
  VerifyEmailType,
  SendEmailResetPasswordType,
  ResetPasswordType,
  LocalAuthType,
  AuthValidateType,
  GetAuthProviderParamType,
} from '../types/auth.type';
import {
  authService,
  authGoogleService,
  authLocalService,
  userActivityLogService,
} from '../services';
import { USER_ACTIVITY_LOG_ACTION_TYPE } from '../enums/prisma.enum';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';

export const authValidate = async (request: Request, response: Response) => {
  logger.start(request);
  const { token }: AuthValidateType = request.body;
  const result = await authLocalService.authValidate(token);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const googleAuth = async (request: Request, response: Response) => {
  logger.start(request);
  const { idToken }: GoogleAuthType = request.body;
  const result = await authGoogleService.login(idToken);
  await userActivityLogService.createUserActivityLog({
    email: (jwtDecode(idToken) as { email?: string })?.email || 'unknown',
    ipAddress: request?.clientIp,
    status: result.status,
    userAgent: request.headers['user-agent'] ? request.headers['user-agent'] : undefined,
    action: USER_ACTIVITY_LOG_ACTION_TYPE.LOGIN,
    failureReason: result.status !== HTTP_RESPONSE_CODE.OK ? String(result.data) : undefined,
  });
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const localAuth = async (request: Request, response: Response) => {
  logger.start(request);
  const { email, password }: LocalAuthType = request.body;
  const device = request.headers['user-agent'] ? request.headers['user-agent'] : undefined;
  const result = await authLocalService.login(email.toLocaleLowerCase(), password, device);
  await userActivityLogService.createUserActivityLog({
    email,
    ipAddress: request?.clientIp,
    status: result.status,
    userAgent: device,
    action: USER_ACTIVITY_LOG_ACTION_TYPE.LOGIN,
    failureReason: result.status !== HTTP_RESPONSE_CODE.OK ? String(result.data) : undefined,
  });
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const sendEmailRegister = async (request: Request, response: Response) => {
  logger.start(request);
  const { email }: SendEmailRegisterType = request.body;
  const result = await authLocalService.sendEmailRegister(email.toLocaleLowerCase());
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
    username: username.toLocaleLowerCase(),
  });
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const sendEmailResetPassword = async (request: Request, response: Response) => {
  logger.start(request);
  const { email }: SendEmailResetPasswordType = request.body;
  const result = await authLocalService.sendEmailResetPassword(email.toLocaleLowerCase());
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

export const getAuthProvider = async (request: Request, response: Response) => {
  logger.start(request);
  const { userId } = request.params as GetAuthProviderParamType;
  const result = await authService.getAuthProvider(userId);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export default {
  authValidate,
  googleAuth,
  localAuth,
  sendEmailRegister,
  verifyEmail,
  register,
  sendEmailResetPassword,
  resetPassword,
  getAuthProvider,
};
