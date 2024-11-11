import { PureAbility } from '@casl/ability';
import { PrismaQuery, Subjects } from '@casl/prisma';

export type AppSubjects = Subjects<{
  getUserById: { id: string };
}>;

export type AppAbility = PureAbility<[string, AppSubjects], PrismaQuery>;
