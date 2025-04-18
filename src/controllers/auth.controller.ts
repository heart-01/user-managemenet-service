import { Request, Response } from 'express';
import { jwtDecode } from 'jwt-decode';
import logger from '../services/logger.service';
import {
  GoogleAuthType,
  SendEmailRegisterType,
  RegisterType,
  VerifyEmailType,
  SendEmailResetPasswordType,
  LocalAuthType,
  AuthValidateType,
  GetAuthProviderParamType,
  ResetPasswordBodyType,
  ResetPasswordParamType,
  GoogleLinkAccountParamType,
  GoogleLinkAccountBodyType,
  GoogleUnlinkAccountParamType,
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
  const device = request.headers['user-agent'] ? request.headers['user-agent'] : undefined;
  const result = await authGoogleService.login(idToken, device);
  await userActivityLogService.createUserActivityLog({
    email: (jwtDecode(idToken) as { email?: string })?.email || 'unknown',
    ipAddress: request?.clientIp,
    status: result.status,
    userAgent: device,
    action: USER_ACTIVITY_LOG_ACTION_TYPE.LOGIN,
    failureReason: result.status !== HTTP_RESPONSE_CODE.OK ? String(result.data) : undefined,
  });
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const googleLinkAccount = async (request: Request, response: Response) => {
  logger.start(request);
  const { providerEmail, providerUserId }: GoogleLinkAccountBodyType = request.body;
  const { id } = request.params as GoogleLinkAccountParamType;
  const result = await authGoogleService.linkAccount({ providerEmail, providerUserId, userId: id });
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const googleUnlinkAccount = async (request: Request, response: Response) => {
  logger.start(request);
  const { id } = request.params as GoogleUnlinkAccountParamType;
  const result = await authGoogleService.unlinkAccount(id);
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
  const { id } = request.params as ResetPasswordParamType;
  const { password, confirmPassword }: ResetPasswordBodyType = request.body;
  const result = await authLocalService.resetPassword(id, { password, confirmPassword });
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
  googleLinkAccount,
  googleUnlinkAccount,
  localAuth,
  sendEmailRegister,
  verifyEmail,
  register,
  sendEmailResetPassword,
  resetPassword,
  getAuthProvider,
};
