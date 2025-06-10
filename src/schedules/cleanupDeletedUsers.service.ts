import { SingleBar, Presets } from 'cli-progress';
import dayjs from '../config/dayjs';
import { prisma, runTransaction } from '../config/database';
import { USER_STATUS } from '../enums/prisma.enum';
import { loggerService } from '../services';

const computeCutoffDate = (days: number): Date => dayjs().subtract(days, 'day').toDate();

const getUsersToDeactivate = (cutoff: Date) =>
  prisma.user.findMany({
    where: { deletedAt: { lte: cutoff }, status: { equals: USER_STATUS.ACTIVATED } },
    select: { id: true, username: true, email: true },
  });

const deactivateUserAndProviders = async (
  userId: string,
  currentUsername: string | null,
  currentEmail: string,
): Promise<void> => {
  const suffix = `_${userId}`;
  const newUsername = currentUsername ? `${currentUsername}${suffix}` : null;
  const newEmail = `${currentEmail}${suffix}`;

  await runTransaction(async (prismaTransaction) => {
    // Update user status
    await prismaTransaction.user.update({
      where: { id: userId },
      data: {
        status: USER_STATUS.DEACTIVATED,
        username: newUsername,
        email: newEmail,
      },
    });

    // Fetch and update each AuthProvider
    const userAuthProviders = await prismaTransaction.authProvider.findMany({
      where: { userId },
      select: { id: true, providerUserId: true },
    });

    const processes = userAuthProviders.map((userAuthProvider) =>
      prismaTransaction.authProvider.update({
        where: { id: userAuthProvider.id },
        data: { providerUserId: `${userAuthProvider.providerUserId}${suffix}` },
      }),
    );
    await Promise.all(processes);
  });
};

const execute = async (olderThanDays = 30): Promise<void> => {
  loggerService.info('Start checking...');
  const cutoff = computeCutoffDate(olderThanDays);
  const usersToDeactivate = await getUsersToDeactivate(cutoff);
  loggerService.info(JSON.stringify(usersToDeactivate));
  const progressBar = new SingleBar(
    { format: 'Deactivating |{bar}| {percentage}% || {value}/{total} users' },
    Presets.shades_classic,
  );

  progressBar.start(usersToDeactivate.length, 0);

  for (let i = 0; i < usersToDeactivate?.length; i += 1) {
    const { id, username, email } = usersToDeactivate[i];
    await deactivateUserAndProviders(id, username, email);
    progressBar.update(i + 1);
  }

  progressBar.stop();
  loggerService.info('Done.');
};

execute();
