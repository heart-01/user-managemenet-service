import { Request, Response } from 'express';
import { userService } from '../services';
import logger from '../services/logger.service';
import { GetUserParamType } from '../types/users.type';

export const getUserById = async (request: Request, response: Response) => {
  logger.start(request);
  const { id } = request.params as GetUserParamType;
  const result = await userService.getUserById(id);
  response.status(result.status).send(result.data);
  logger.end(request);
};

export default {
  getUserById,
};
