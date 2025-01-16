import { Prisma, PrismaClient } from '@prisma/client';

const TRANSACTION_TIMEOUT = 5000; // 5 seconds

const prisma = new PrismaClient();

const runTransaction = <T>(
  fn: (prismaTransaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> => prisma.$transaction(fn, { timeout: TRANSACTION_TIMEOUT });

export { Prisma, prisma, runTransaction };
