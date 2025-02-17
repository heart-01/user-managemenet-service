import { USER_ACTIVITY_LOG_ACTION_TYPE } from '@prisma/client';

export type UserActivityLogType = {
  email: string;
  ipAddress?: string;
  userAgent?: string;
  status: number;
  action: USER_ACTIVITY_LOG_ACTION_TYPE;
  failureReason?: string;
};

export type IPInfoType = {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
};
