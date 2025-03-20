import type { Request, Response } from 'express';
import { userService } from '../services';
import logger from '../services/logger.service';
import type {
  CheckUsernameQueryType,
  GetUserParamType,
  UpdateUserBodyType,
  UpdateUserParamType,
} from '../types/users.type';

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

export const updateUser = async (request: Request, response: Response) => {
  logger.start(request);
  const { id } = request.params as UpdateUserParamType;
  const { bio, name, password, username } = request.body as UpdateUserBodyType;
  const data = {
    ...(bio !== undefined && {
      bio,
    }),
    ...(name !== undefined && {
      name,
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

export default {
  getUserById,
  checkUsername,
  updateUser,
  deleteUser,
};
