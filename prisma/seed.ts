import { PrismaClient } from '@prisma/client';
import loggerService from '../src/services/logger.service';

const prisma = new PrismaClient();

const seed = async () => {
  try {
    await prisma.user.createMany({
      data: [
        {
          name: 'John Doe',
          username: 'johndoe',
          password: 'password',
          email: 'john@email.com',
          status: 'ACTIVATED',
        },
        {
          name: 'Jane Smith',
          username: 'janesmith',
          password: 'password',
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          type: 'PRIVATE',
          content: 'Private policy',
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
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
