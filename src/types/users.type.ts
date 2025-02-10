import type { AuthProvider, User } from '@prisma/client';

export type GetUserParamType = {
  id: string;
};

export type CheckUsernameQueryType = {
  username: string;
};

export type UserType = Omit<User, 'password'>;

export type UserAuthType = UserType & {
  AuthProvider: [AuthProvider];
};
