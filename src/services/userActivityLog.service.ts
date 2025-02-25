import { UserActivityLog } from '@prisma/client';
import { prisma } from '../config/database';
import dayjs from '../config/dayjs';
import { ipinfoAxios } from '../config/axios';
import { IPINFO_API_KEY, USER_ACTIVITY_ATTEMPT_LOGIN_LIMIT } from '../config/dotenv';
import loggerService from './logger.service';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { USER_ACTIVITY_LOG_ACTION_TYPE } from '../enums/prisma.enum';
import { ResponseCommonType } from '../types/common.type';
import { IPInfoType, UserActivityLogType } from '../types/userActivityLog';

const getIPInfo = async (ipAddress: string): Promise<ResponseCommonType<IPInfoType | Error>> => {
  try {
    loggerService.info('getIPInfo');
    const result = await ipinfoAxios.get<IPInfoType>(`/${ipAddress}?token=${IPINFO_API_KEY}`);
    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result.data,
    };
  } catch (error) {
    loggerService.error(`getIPInfo: ${error}`);
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

const createUserActivityLog = async (
  userActivityLog: UserActivityLogType,
): Promise<ResponseCommonType<UserActivityLog | Error>> => {
  try {
    loggerService.info('createUserActivityLog');

    const ipAddress = userActivityLog?.ipAddress;
    let location = null;
    if (ipAddress) {
      const getIPInfoResult = await getIPInfo(ipAddress);
      location = (getIPInfoResult?.data as IPInfoType)?.region || null;
    }

    const result: UserActivityLog = await prisma.userActivityLog.create({
      data: {
        email: userActivityLog.email,
        loginTime: new Date(),
        ipAddress,
        location,
        userAgent: userActivityLog?.userAgent,
        status: userActivityLog.status,
        action: userActivityLog.action,
        failureReason: userActivityLog?.failureReason,
        createdAt: new Date(),
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

const checkRecentLoginAttempts = async (
  email: string,
): Promise<ResponseCommonType<UserActivityLog[] | number | Error>> => {
  try {
    loggerService.info('checkRecentLoginAttempts');
    const timeLimit = 15; // 15 minutes
    const timeLimitMinutesAgo = dayjs().subtract(timeLimit, 'minute').toDate();
    const userActivityLog: UserActivityLog[] | null = await prisma.userActivityLog.findMany({
      where: {
        email,
        action: USER_ACTIVITY_LOG_ACTION_TYPE.LOGIN,
        createdAt: { gte: timeLimitMinutesAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Find the last successful login
    const loginSuccessLastIndex = userActivityLog.findIndex(
      (activityLog) => activityLog.status === 200,
    );
    if (loginSuccessLastIndex !== -1) {
      // Remove log records after the last successful login
      userActivityLog.splice(loginSuccessLastIndex);
    }

    // Filter out failed login attempts
    const consecutiveFailed = userActivityLog.filter(
      (record) => record.status === HTTP_RESPONSE_CODE.UNAUTHORIZED,
    );

    // Check if the number of consecutive failed login attempts exceeds the limit
    if (consecutiveFailed.length === USER_ACTIVITY_ATTEMPT_LOGIN_LIMIT) {
      const lastFailedTime = consecutiveFailed[0].createdAt;
      const lockExpiresAt = dayjs(lastFailedTime).add(timeLimit, 'minute');
      const timeLeft = lockExpiresAt.diff(dayjs(), 'second');
      return {
        status: HTTP_RESPONSE_CODE.FORBIDDEN,
        data: timeLeft,
      };
    }

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: consecutiveFailed,
    };
  } catch (error) {
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export default {
  getIPInfo,
  createUserActivityLog,
  checkRecentLoginAttempts,
};
