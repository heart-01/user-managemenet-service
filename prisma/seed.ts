import { PrismaClient } from '@prisma/client';
import loggerService from '../src/services/logger.service';

const prisma = new PrismaClient();

const seed = async () => {
  try {
    await prisma.users.create({
      data: {
        name: 'John Doe',
        username: 'johndoe',
        password: 'password',
        email: 'john@email.com',
        status: 'ACTIVATED',
      },
    });
  } catch (error: any) {
    loggerService.error(error);
  } finally {
    await prisma.$disconnect();
  }
};

seed();
