import { Request, Response } from 'express';
import logger from '../services/logger.service';
import {
  GoogleAuthType,
  LocalRegisterType,
  RegisterCompleteType,
  VerifyEmailType,
} from '../types/auth.type';
import { authGoogleService, authLocalService } from '../services';

export const googleAuth = async (request: Request, response: Response) => {
  logger.start(request);
  const { idToken }: GoogleAuthType = request.body;
  const result = await authGoogleService.login(idToken);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const localRegister = async (request: Request, response: Response) => {
  logger.start(request);
  const { email }: LocalRegisterType = request.body;
  const result = await authLocalService.register(email);
  response.status(result.status).send(result.data);

  logger.end(request);
};

export const verifyEmail = async (request: Request, response: Response) => {
  logger.start(request);
  const { token }: VerifyEmailType = request.body;
  const result = await authLocalService.verifyEmail(token);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const registerComplete = async (request: Request, response: Response) => {
  logger.start(request);
  const { userId, password, confirmPassword, userPolicy, name, username } =
    request.body as RegisterCompleteType;
  const result = await authLocalService.registerComplete({
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

export default {
  googleAuth,
  localRegister,
  verifyEmail,
  registerComplete,
};
