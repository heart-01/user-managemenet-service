import { prisma } from '../../config/database';
import users1 from './fixtures/user1';

type ModelDelegate = {
  createMany: (args: { data: any[] }) => Promise<any>;
};

const initDB = async () => {
  try {
    await prisma.$connect();
  } catch (e) {
    console.error(e);
  }
};

const loadFixtures = async (model: ModelDelegate, data: any[]) => {
  await model.createMany({ data });
};

const setupSimpleScenarioFixtures = async () => {
  try {
    await loadFixtures(prisma.user, [users1]);
  } catch (e) {
    console.error(e);
  }
};

const cleanupData = async () => {
  try {
    await prisma.user.deleteMany({});
  } catch (e) {
    console.error(e);
  }
};

export { initDB, setupSimpleScenarioFixtures, cleanupData };
