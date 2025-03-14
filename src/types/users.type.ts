import type { AuthProvider, User } from '@prisma/client';

export type GetUserParamType = {
  id: string;
};

export type CheckUsernameQueryType = {
  username: string;
};

export type UserType = Omit<User, 'password'>;

export type UserAuthType = UserType & {
  AuthProvider?: [AuthProvider];
};

export type UpdateUserBodyType = {
  bio?: string | null;
  name?: string | null;
  password?: string;
  username?: string;
};

export type UpdateUserParamType = {
  id: string;
};
