import { PureAbility } from '@casl/ability';
import { PrismaQuery, Subjects } from '@casl/prisma';

export type AppSubjects = Subjects<{
  getUserById: { id: string };
  updateUser: { id: string };
  deleteUser: { id: string };
  getAuthProvider: { userId: string };
  register: { userId: string };
  resetPassword: { userId: string };
}>;

export type AppAbility = PureAbility<[string, AppSubjects], PrismaQuery>;
