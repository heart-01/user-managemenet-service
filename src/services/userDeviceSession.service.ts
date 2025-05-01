import { UserDeviceSession } from '@prisma/client';
import { prisma } from '../config/database';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { ResponseCommonType } from '../types/common.type';
import { UserDeviceSessionType } from '../types/users.type';
import loggerService from './logger.service';
import { RecordNotFoundError } from '../errors';
import { sendEmailWithTemplate } from '../utils/email';
import { EMAIL_SUBJECT } from '../enums/email.enum';
import { SENDGRID_TEMPLATE_LOGIN_DEVICE_EMAIL } from '../config/dotenv';

const upsertUserDeviceSession = async (
  email: string,
  userDeviceSession: UserDeviceSessionType,
): Promise<ResponseCommonType<UserDeviceSession | Error>> => {
  try {
    loggerService.info('createUserDeviceSession');
    loggerService.debug('userDeviceSession', userDeviceSession);
    loggerService.debug('email', email);
    const existUserDeviceSession = await prisma.userDeviceSession.findFirst({
      where: {
        userId: userDeviceSession.userId,
        deviceId: userDeviceSession.deviceId,
      },
    });
    if (existUserDeviceSession) {
      const updateUserDeviceSession = await prisma.userDeviceSession.update({
        where: {
          userId_deviceId: {
            userId: userDeviceSession.userId,
            deviceId: userDeviceSession.deviceId,
          },
        },
        data: { lastActiveAt: new Date() },
      });
      return {
        status: HTTP_RESPONSE_CODE.OK,
        data: updateUserDeviceSession,
      };
    }
    const result = await prisma.userDeviceSession.create({
      data: {
        userId: userDeviceSession.userId,
        deviceId: userDeviceSession.deviceId,
        deviceName: userDeviceSession?.deviceName,
        ipAddress: userDeviceSession?.ipAddress,
      },
    });
    // Send email alert login new device
    await sendEmailWithTemplate({
      to: email,
      subject: EMAIL_SUBJECT.LoginDevice,
      templateId: SENDGRID_TEMPLATE_LOGIN_DEVICE_EMAIL,
      dynamicTemplateData: { device: userDeviceSession?.deviceName },
    });
    return {
      status: HTTP_RESPONSE_CODE.CREATED,
      data: result,
    };
  } catch (error) {
    loggerService.error(error);
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

const countActiveSessions = async (userId: string): Promise<ResponseCommonType<number | Error>> => {
  try {
    loggerService.info('countActiveSessions');
    loggerService.debug('userId', userId);
    const result = await prisma.userDeviceSession.count({ where: { userId } });
    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result,
    };
  } catch (error) {
    loggerService.error(error);
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

const listActiveSessions = async (
  userId: string,
): Promise<ResponseCommonType<UserDeviceSession[] | Error>> => {
  try {
    loggerService.info('listActiveSessions');
    loggerService.debug('userId', userId);
    const result = await prisma.userDeviceSession.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'asc' },
    });
    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result,
    };
  } catch (error) {
    loggerService.error(error);
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

const getDeviceId = async (
  userId: string,
  deviceId: string,
): Promise<ResponseCommonType<UserDeviceSession | Error>> => {
  try {
    loggerService.info('getDeviceId');
    loggerService.debug('userId', userId);
    loggerService.debug('deviceId', deviceId);
    const result = await prisma.userDeviceSession.findFirst({
      where: { userId, deviceId },
      orderBy: { createdAt: 'desc' },
    });
    if (!result) {
      return {
        status: HTTP_RESPONSE_CODE.NOT_FOUND,
        data: new RecordNotFoundError(
          `UserDeviceSession userId ${userId} with deviceId ${deviceId} not found`,
        ),
      };
    }
    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result,
    };
  } catch (error) {
    loggerService.error(error);
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

const revokeSession = async (
  userId: string,
  deviceId: string,
): Promise<ResponseCommonType<UserDeviceSession | Error>> => {
  try {
    loggerService.info('revokeSession');
    loggerService.debug('userId', userId);
    loggerService.debug('deviceId', deviceId);
    const userDeviceSession = await prisma.userDeviceSession.findFirst({
      where: { userId, deviceId },
    });
    if (!userDeviceSession) {
      return {
        status: HTTP_RESPONSE_CODE.NOT_FOUND,
        data: new RecordNotFoundError(
          `UserDeviceSession userId ${userId} with deviceId ${deviceId} not found`,
        ),
      };
    }
    const result = await prisma.userDeviceSession.delete({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    });
    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result,
    };
  } catch (error) {
    loggerService.error(error);
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

const updateUserDeviceSessionActive = async (
  userId: string,
  deviceId: string,
): Promise<ResponseCommonType<UserDeviceSession[] | Error>> => {
  try {
    loggerService.info('updateUserDeviceSessionActive');
    loggerService.debug('userId', userId);
    loggerService.debug('deviceId', deviceId);
    const existUserDeviceSession = await prisma.userDeviceSession.findFirst({
      where: { userId, deviceId },
    });
    if (!existUserDeviceSession) {
      const userDeviceSessionCurrent = await prisma.userDeviceSession.findMany({
        where: { userId },
        orderBy: { lastActiveAt: 'asc' },
      });
      return {
        status: HTTP_RESPONSE_CODE.SESSION_EXPIRED,
        data: new RecordNotFoundError(
          `UserDeviceSession userId ${userId} with deviceId ${deviceId} not found. Current sessions: [${userDeviceSessionCurrent[0].deviceName} - ${userDeviceSessionCurrent[0].ipAddress}]`,
        ),
      };
    }
    await prisma.userDeviceSession.update({
      where: { userId_deviceId: { userId, deviceId } },
      data: { lastActiveAt: new Date() },
    });
    const result = await prisma.userDeviceSession.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'asc' },
    });
    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result,
    };
  } catch (error) {
    loggerService.error(error);
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

const pruneOldestSessionIfExceeded = async (
  userId: string,
  deviceId: string,
): Promise<ResponseCommonType<UserDeviceSession[] | UserDeviceSession | Error>> => {
  try {
    const getDeviceIdRes = await getDeviceId(userId, deviceId as string);
    if (getDeviceIdRes.status === HTTP_RESPONSE_CODE.NOT_FOUND) {
      // If device session count exceeds the limit, remove the oldest session
      const listActiveSessionsRes = await listActiveSessions(userId);
      if (listActiveSessionsRes.status !== HTTP_RESPONSE_CODE.OK) {
        return {
          status: HTTP_RESPONSE_CODE.CONFLICT,
          data: listActiveSessionsRes.data,
        };
      }
      const oldestUserDeviceSession = listActiveSessionsRes.data as UserDeviceSession[];
      const revokeSessionRes = await revokeSession(
        oldestUserDeviceSession[0].userId,
        oldestUserDeviceSession[0].deviceId,
      );
      if (revokeSessionRes.status !== HTTP_RESPONSE_CODE.OK) {
        return {
          status: HTTP_RESPONSE_CODE.CONFLICT,
          data: revokeSessionRes.data,
        };
      }
    } else if (getDeviceIdRes.status !== HTTP_RESPONSE_CODE.OK) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: getDeviceIdRes.data,
      };
    }
    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: getDeviceIdRes.data,
    };
  } catch (error) {
    loggerService.error(error);
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export default {
  upsertUserDeviceSession,
  countActiveSessions,
  listActiveSessions,
  getDeviceId,
  revokeSession,
  updateUserDeviceSessionActive,
  pruneOldestSessionIfExceeded,
};
