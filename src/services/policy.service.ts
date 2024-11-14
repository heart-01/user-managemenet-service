import { Policy } from '@prisma/client';
import { prisma } from '../config/database';
import loggerService from './logger.service';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { ResponseCommonType } from '../types/common.type';

export const getPolicy = async (): Promise<ResponseCommonType<Policy[] | Error>> => {
  try {
    loggerService.info('getPolicy');

    const results: Policy[] | null = await prisma.policy.findMany();

    if (results.length === 0) {
      return {
        status: HTTP_RESPONSE_CODE.OK,
        data: [],
      };
    }

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: results,
    };
  } catch (error) {
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export default {
  getPolicy,
};
