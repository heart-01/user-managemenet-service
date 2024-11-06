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
        profileImageUrl: true,
        status: true,
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

export default {
  getUserById,
};
