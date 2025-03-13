import type { AuthProvider } from '@prisma/client';
import type { ResponseCommonType } from '../types/common.type';
import { prisma } from '../config/database';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';

const getAuthProvider = async (
  userId: string,
): Promise<ResponseCommonType<AuthProvider[] | Error>> => {
  try {
    const result = await prisma.authProvider.findMany({
      where: {
        userId,
      },
    });
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
  getAuthProvider,
};
