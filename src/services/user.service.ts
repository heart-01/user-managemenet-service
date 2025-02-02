import { prisma } from '../config/database';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { RecordNotFoundError } from '../errors';
import { ResponseCommonType } from '../types/common.type';
import { UserType } from '../types/users.type';
import loggerService from './logger.service';

export const getUserById = async (id: string): Promise<ResponseCommonType<UserType | Error>> => {
  try {
    loggerService.info('getUserById');
    loggerService.debug('userId', id);

    const result: UserType | null = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        bio: true,
        username: true,
        email: true,
        imageUrl: true,
        status: true,
        latestLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!result) {
      return {
        status: HTTP_RESPONSE_CODE.NOT_FOUND,
        data: new RecordNotFoundError('User not found'),
      };
    }

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result,
    };
  } catch (error) {
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export const checkUsername = async (
  username: string,
): Promise<ResponseCommonType<boolean | Error>> => {
  try {
    loggerService.info('checkUsername');
    loggerService.debug('username', username);

    const result = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
      },
    });

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: Boolean(result),
    };
  } catch (error) {
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export default {
  getUserById,
  checkUsername,
};
