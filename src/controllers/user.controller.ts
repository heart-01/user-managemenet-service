import type { Request, Response } from 'express';
import { authLocalService, userDeviceSessionService, userService } from '../services';
import logger from '../services/logger.service';
import type {
  CheckUsernameQueryType,
  GetUserParamType,
  SendEmailDeleteAccountBodyType,
  UpdateUserBodyType,
  UpdateUserDeviceSessionActiveBodyType,
  UpdateUserParamType,
  UserDeletionFeedbackBodyType,
} from '../types/users.type';
import { VerifyEmailType } from '../types/auth.type';

export const getUserById = async (request: Request, response: Response) => {
  logger.start(request);
  const { id } = request.params as GetUserParamType;
  const result = await userService.getUserById(id);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const checkUsername = async (request: Request, response: Response) => {
  logger.start(request);
  const { userId, username } = request.query as CheckUsernameQueryType;
  const result = await userService.checkUsername(userId, username);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const updateUser = async (request: Request, response: Response) => {
  logger.start(request);
  const { id } = request.params as UpdateUserParamType;
  const { bio, firstname, lastname, password, username } = request.body as UpdateUserBodyType;
  const data = {
    ...(bio !== undefined && {
      bio,
    }),
    ...(firstname !== undefined && {
      firstname,
    }),
    ...(lastname !== undefined && {
      lastname,
    }),
    ...(password !== undefined && {
      password,
    }),
    ...(username !== undefined && {
      username,
    }),
  };

  const result = await userService.updateUser(id, data);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const deleteUser = async (request: Request, response: Response) => {
  logger.start(request);
  const { id } = request.params as GetUserParamType;
  const result = await userService.deleteUser(id);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const userDeletionFeedback = async (request: Request, response: Response) => {
  logger.start(request);
  const { id } = request.params as GetUserParamType;
  const { reason } = request.body as UserDeletionFeedbackBodyType;
  const result = await userService.userDeletionFeedback(id, reason);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const sendEmailDeleteAccount = async (request: Request, response: Response) => {
  logger.start(request);
  const { email } = request.body as SendEmailDeleteAccountBodyType;
  const result = await userService.sendEmailDeleteAccount(email);
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

export const getUserDeviceSessionActive = async (request: Request, response: Response) => {
  logger.start(request);
  const { id: userId } = request.params as GetUserParamType;
  const result = await userDeviceSessionService.listActiveSessions(userId);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const updateUserDeviceSessionActive = async (request: Request, response: Response) => {
  logger.start(request);
  const { id: userId } = request.params as GetUserParamType;
  const { deviceId } = request.body as UpdateUserDeviceSessionActiveBodyType;
  const result = await userDeviceSessionService.updateUserDeviceSessionActive(userId, deviceId);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export default {
  getUserById,
  checkUsername,
  updateUser,
  deleteUser,
  userDeletionFeedback,
  sendEmailDeleteAccount,
  verifyEmail,
  getUserDeviceSessionActive,
  updateUserDeviceSessionActive,
};
