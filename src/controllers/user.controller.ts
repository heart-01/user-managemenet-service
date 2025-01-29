import { Request, Response } from 'express';
import { userService } from '../services';
import logger from '../services/logger.service';
import { CheckUsernameQueryType, GetUserParamType } from '../types/users.type';

export const getUserById = async (request: Request, response: Response) => {
  logger.start(request);
  const { id } = request.params as GetUserParamType;
  const result = await userService.getUserById(id);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export const checkUsername = async (request: Request, response: Response) => {
  logger.start(request);
  const { username } = request.query as CheckUsernameQueryType;
  const result = await userService.checkUsername(username);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export default {
  getUserById,
  checkUsername,
};
