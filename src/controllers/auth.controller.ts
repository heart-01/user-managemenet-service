import { Request, Response } from 'express';
import logger from '../services/logger.service';
import { googleAuthType } from '../types/auth.type';
import { authService } from '../services';

export const googleAuth = async (request: Request, response: Response) => {
  logger.start(request);

  const { idToken }: googleAuthType = request.body;

  const result = await authService.googleAuth(idToken);
  response.status(result.status).send(result.data);

  logger.end(request);
};

export default {
  googleAuth,
};