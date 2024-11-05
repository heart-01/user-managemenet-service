import type { Users } from '@prisma/client';

export type GetUserParamType = {
  id: string;
};

export type UserType = Omit<Users, 'password'>;
