import { Prisma, PrismaClient, AuthProviderName, UserStatus } from '@prisma/client';

const TRANSACTION_TIMEOUT = 5000; // 5 seconds

export { Prisma, AuthProviderName, UserStatus };
export const prisma = new PrismaClient();
export const runTransaction = <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> =>
  prisma.$transaction(fn, { timeout: TRANSACTION_TIMEOUT });
