import type { User } from '@prisma/client';

export type GetUserParamType = {
  id: string;
};

export type UserType = Omit<User, 'password'>;
