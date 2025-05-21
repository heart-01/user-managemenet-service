import type { AuthProvider, User } from '@prisma/client';

export type GetUserParamType = {
  id: string;
};

export type CheckUsernameQueryType = {
  userId: string;
  username: string;
};

export type UserType = Omit<User, 'password' | 'deletedAt'>;

export type UserAuthType = UserType & {
  password: boolean;
  deletedAt: Date | null;
  AuthProvider: [AuthProvider] | [];
};

export type UpdateUserBodyType = {
  bio?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  password?: string;
  username?: string;
};

export type UpdateUserParamType = {
  id: string;
};

export type UserDeletionFeedbackBodyType = {
  reason: string;
};

export type SendEmailDeleteAccountBodyType = {
  email: string;
};

export type UserDeviceSessionType = {
  userId: string;
  deviceId: string;
  deviceName?: string;
  ipAddress?: string;
};

export type UpdateUserDeviceSessionActiveBodyType = {
  deviceId: string;
};
