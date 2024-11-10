import { PureAbility, AbilityBuilder } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { UserType } from '../types/users.type';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type AppSubjects = Subjects<{
  'getUserById': { id: string };
}>;
type AppAbility = PureAbility<[string, AppSubjects], PrismaQuery>;

export const defineAbilitiesFor = (user: UserType): AppAbility => {
  const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

  // Define abilities for User
  can('read', 'getUserById', { id: user.id });

  return build();
};
