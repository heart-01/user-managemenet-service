import { prisma } from '../config/database';
import dayjs from '../config/dayjs';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { ConflictError, RecordNotFoundError } from '../errors';
import loggerService from './logger.service';
import { hashPassword, verifyPassword } from '../utils/hashing';
import type { ResponseCommonType } from '../types/common.type';
import type { UpdateUserBodyType, UserType } from '../types/users.type';

export const getUserById = async (id: string): Promise<ResponseCommonType<UserType | Error>> => {
  try {
    loggerService.info('getUserById');
    loggerService.debug('userId', id);

    const result = await prisma.user.findUnique({
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
      data: result as UserType,
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

export const updateUser = async (
  id: string,
  data: UpdateUserBodyType,
): Promise<ResponseCommonType<UserType | Error>> => {
  try {
    const { username, password } = data;

    // Validate user exist
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return {
        status: HTTP_RESPONSE_CODE.NOT_FOUND,
        data: new RecordNotFoundError('User not found'),
      };
    }

    // Validate username
    if (username && username === user.username) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: new ConflictError('Username already exists'),
      };
    }

    // Validate password
    const isPasswordMatch =
      password && user.password ? await verifyPassword(password, user.password) : false;
    if (isPasswordMatch) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: new ConflictError('Duplicate password.'),
      };
    }

    // Update user
    const hashedPassword = password ? await hashPassword(password) : null;
    const result = await prisma.user.update({
      where: {
        id,
      },
      data: {
        ...data,
        ...(hashedPassword && {
          password: hashedPassword,
        }),
        updatedAt: dayjs().toDate(),
      },
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

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result as UserType,
    };
  } catch (error) {
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export const deleteUser = async (id: string): Promise<ResponseCommonType<UserType | Error>> => {
  try {
    // Validate user exist
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return {
        status: HTTP_RESPONSE_CODE.NOT_FOUND,
        data: new RecordNotFoundError('User not found'),
      };
    }

    const result = await prisma.user.update({
      where: {
        id,
      },
      data: {
        deletedAt: dayjs().toDate(),
      },
    });

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result as UserType,
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
  updateUser,
  deleteUser,
};
