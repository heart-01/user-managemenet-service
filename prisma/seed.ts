import { PrismaClient } from '@prisma/client';
import loggerService from '../src/services/logger.service';
import { hashPassword } from '../src/utils/hashing';

const prisma = new PrismaClient();

const seed = async () => {
  try {
    await prisma.user.createMany({
      data: [
        {
          name: 'John Doe',
          username: 'johndoe',
          password: await hashPassword('password'),
          email: 'john@email.com',
          status: 'ACTIVATED',
        },
        {
          name: 'Jane Smith',
          username: 'janesmith',
          password: await hashPassword('password'),
          email: 'jane@email.com',
          status: 'ACTIVATED',
        },
      ],
    });

    await prisma.policy.createMany({
      data: [
        {
          type: 'TERMOFSERVICES',
          content: 'Termofservices policy',
          version: '1.0.0',
        },
        {
          type: 'PRIVATE',
          content: 'Private policy',
          version: '1.0.0',
        },
      ],
    });
  } catch (error: any) {
    loggerService.error(error);
  } finally {
    await prisma.$disconnect();
  }
};

seed();
