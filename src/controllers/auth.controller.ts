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
  AuthResponseType,
} from '../types/auth.type';
import {
  authService,
  authGoogleService,
  authLocalService,
  userActivityLogService,
  userService,
  userDeviceSessionService,
} from '../services';
import { USER_ACTIVITY_LOG_ACTION_TYPE } from '../enums/prisma.enum';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { ResponseError } from '../errors';
import { USER_LOGIN_DEVICE_SESSION_LIMIT } from '../config/dotenv';

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
  const deviceId = request.headers['x-device-id'] ? request.headers['x-device-id'] : undefined;
  const device = request.headers['user-agent'] ? request.headers['user-agent'] : undefined;

  // Validate the presence of deviceId
  if (!deviceId) {
    response
      .status(HTTP_RESPONSE_CODE.BAD_REQUEST)
      .send({ data: new ResponseError('Device ID is required') });
    return;
  }

  // Login with Google
  const googleLogin = await authGoogleService.login(idToken);

  // Create log for user activity
  const userActiveityLog = await userActivityLogService.createUserActivityLog({
    email: (jwtDecode(idToken) as { email?: string })?.email || 'unknown',
    ipAddress: request?.clientIp,
    status: googleLogin.status,
    userAgent: device,
    action: USER_ACTIVITY_LOG_ACTION_TYPE.LOGIN,
    failureReason:
      googleLogin.status !== HTTP_RESPONSE_CODE.OK ? String(googleLogin.data) : undefined,
  });
  if (userActiveityLog.status !== HTTP_RESPONSE_CODE.CREATED) {
    response.status(userActiveityLog.status).send(userActiveityLog.data);
    logger.end(request);
    return;
  }

  if (googleLogin.status === HTTP_RESPONSE_CODE.OK) {
    const userId = (googleLogin.data as AuthResponseType).user.id;

    // Check if the user is deleted and recover if necessary.
    if ((googleLogin.data as AuthResponseType).user.deletedAt !== null) {
      const userRecover = await userService.recoverUser(userId);
      if (userRecover.status !== HTTP_RESPONSE_CODE.OK) {
        response.status(userRecover.status).send(userRecover.data);
        logger.end(request);
        return;
      }
    }

    // If the number of device sessions does not exceed devices, add a new session.
    const countUserDeviceSession = await userDeviceSessionService.countActiveSessions(userId);
    if (countUserDeviceSession.status !== HTTP_RESPONSE_CODE.OK) {
      response.status(countUserDeviceSession.status).send(countUserDeviceSession.data);
      logger.end(request);
      return;
    }
    const activeCountUserDeviceSession = Number(countUserDeviceSession.data);
    if (activeCountUserDeviceSession >= Number(USER_LOGIN_DEVICE_SESSION_LIMIT)) {
      const pruneOldestSessionIfExceededRes =
        await userDeviceSessionService.pruneOldestSessionIfExceeded(userId, String(deviceId));
      if (pruneOldestSessionIfExceededRes.status !== HTTP_RESPONSE_CODE.OK) {
        response
          .status(pruneOldestSessionIfExceededRes.status)
          .send(pruneOldestSessionIfExceededRes.data);
        logger.end(request);
        return;
      }
    }
    const upsertUserDeviceSession = await userDeviceSessionService.upsertUserDeviceSession(
      (googleLogin.data as AuthResponseType).user.email,
      {
        userId: (googleLogin.data as AuthResponseType).user.id,
        deviceId: String(deviceId),
        deviceName: device,
        ipAddress: request?.clientIp,
      },
    );
    if (upsertUserDeviceSession.status === HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR) {
      response.status(upsertUserDeviceSession.status).send(upsertUserDeviceSession.data);
      logger.end(request);
      return;
    }
  }

  response.status(googleLogin.status).send(googleLogin.data);
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
  const deviceId = request.headers['x-device-id'] ? request.headers['x-device-id'] : undefined;
  const device = request.headers['user-agent'] ? request.headers['user-agent'] : undefined;

  // Validate the presence of deviceId
  if (!deviceId) {
    response
      .status(HTTP_RESPONSE_CODE.BAD_REQUEST)
      .send({ data: new ResponseError('Device ID is required') });
    return;
  }

  // Login with local authentication
  const localLogin = await authLocalService.login(email.toLocaleLowerCase(), password);

  // Create log for user activity
  const userActiveityLog = await userActivityLogService.createUserActivityLog({
    email,
    ipAddress: request?.clientIp,
    status: localLogin.status,
    userAgent: device,
    action: USER_ACTIVITY_LOG_ACTION_TYPE.LOGIN,
    failureReason:
      localLogin.status !== HTTP_RESPONSE_CODE.OK ? String(localLogin.data) : undefined,
  });
  if (userActiveityLog.status !== HTTP_RESPONSE_CODE.CREATED) {
    response.status(userActiveityLog.status).send(userActiveityLog.data);
    logger.end(request);
    return;
  }

  if (localLogin.status === HTTP_RESPONSE_CODE.OK) {
    const userId = (localLogin.data as AuthResponseType).user.id;

    // Check if the user is deleted and recover if necessary.
    if ((localLogin.data as AuthResponseType).user.deletedAt !== null) {
      const userRecover = await userService.recoverUser(userId);
      if (userRecover.status !== HTTP_RESPONSE_CODE.OK) {
        response.status(userRecover.status).send(userRecover.data);
        logger.end(request);
        return;
      }
    }

    // If the number of device sessions does not exceed devices, add a new session.
    const countUserDeviceSession = await userDeviceSessionService.countActiveSessions(userId);
    if (countUserDeviceSession.status !== HTTP_RESPONSE_CODE.OK) {
      response.status(countUserDeviceSession.status).send(countUserDeviceSession.data);
      logger.end(request);
      return;
    }
    const activeCountUserDeviceSession = Number(countUserDeviceSession.data);
    if (activeCountUserDeviceSession >= Number(USER_LOGIN_DEVICE_SESSION_LIMIT)) {
      const pruneOldestSessionIfExceededRes =
        await userDeviceSessionService.pruneOldestSessionIfExceeded(userId, String(deviceId));
      if (pruneOldestSessionIfExceededRes.status !== HTTP_RESPONSE_CODE.OK) {
        response
          .status(pruneOldestSessionIfExceededRes.status)
          .send(pruneOldestSessionIfExceededRes.data);
        logger.end(request);
        return;
      }
    }
    const upsertUserDeviceSession = await userDeviceSessionService.upsertUserDeviceSession(
      (localLogin.data as AuthResponseType).user.email,
      {
        userId: (localLogin.data as AuthResponseType).user.id,
        deviceId: String(deviceId),
        deviceName: device,
        ipAddress: request?.clientIp,
      },
    );
    if (upsertUserDeviceSession.status === HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR) {
      response.status(upsertUserDeviceSession.status).send(upsertUserDeviceSession.data);
      logger.end(request);
      return;
    }
  }

  response.status(localLogin.status).send(localLogin.data);
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
  const { userId, password, confirmPassword, userPolicy, firstname, lastname, username } =
    request.body as RegisterType;
  const result = await authLocalService.register({
    userId,
    password,
    confirmPassword,
    userPolicy,
    firstname,
    lastname,
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
