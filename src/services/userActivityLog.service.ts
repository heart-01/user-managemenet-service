import axios from 'axios';
import { UserActivityLog } from '@prisma/client';
import { prisma } from '../config/database';
import dayjs from '../config/dayjs';
import { IPINFO_API_KEY, USER_ACTIVITY_ATTEMPT_LOGIN_LIMIT } from '../config/dotenv';
import loggerService from './logger.service';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { USER_ACTIVITY_LOG_ACTION_TYPE } from '../enums/prisma.enum';
import { ResponseCommonType } from '../types/common.type';
import { IPInfoType, UserActivityLogType } from '../types/userActivityLog';

const getIPInfo = async (ipAddress: string): Promise<ResponseCommonType<IPInfoType | Error>> => {
  try {
    loggerService.info('getIPInfo');
    const url = `https://ipinfo.io/${ipAddress}?token=${IPINFO_API_KEY}`;
    const result = await axios.get<IPInfoType>(url);
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
): Promise<ResponseCommonType<UserActivityLog[] | Error>> => {
  try {
    loggerService.info('checkRecentLoginAttempts');

    const fifteenMinutesAgo = dayjs().subtract(15, 'minute').toDate();
    const userActivityLog: UserActivityLog[] | null = await prisma.userActivityLog.findMany({
      where: {
        email,
        action: USER_ACTIVITY_LOG_ACTION_TYPE.LOGIN,
        createdAt: { gte: fifteenMinutesAgo },
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
      return {
        status: HTTP_RESPONSE_CODE.FORBIDDEN,
        data: consecutiveFailed,
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
