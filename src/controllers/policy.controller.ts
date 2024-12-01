import { Request, Response } from 'express';
import { policyService } from '../services';
import logger from '../services/logger.service';

export const getPolicy = async (request: Request, response: Response) => {
  logger.start(request);
  const result = await policyService.getPolicy();
  response.status(result.status).send(result.data);
  logger.end(request);
};

export default {
  getPolicy,
};
