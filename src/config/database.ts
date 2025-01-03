import { Prisma, PrismaClient, AUTH_PROVIDER_NAME, USER_STATUS, ACTION_TYPE } from '@prisma/client';

const TRANSACTION_TIMEOUT = 5000; // 5 seconds

export { Prisma, AUTH_PROVIDER_NAME, USER_STATUS, ACTION_TYPE };
export const prisma = new PrismaClient();
export const runTransaction = <T>(
  fn: (prismaTransaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> => prisma.$transaction(fn, { timeout: TRANSACTION_TIMEOUT });
