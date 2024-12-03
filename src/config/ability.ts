import { AbilityBuilder } from '@casl/ability';
import { createPrismaAbility } from '@casl/prisma';
import { UserType } from '../types/users.type';
import { AppAbility } from '../types/ability.type';
import { Actions } from '../enums/ability.enum';

export const defineAbilitiesFor = (user: UserType): AppAbility => {
  const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

  // Define abilities for User
  can(Actions.Read, 'getUserById', { id: user.id });

  // Define abilities for Auth
  can(Actions.Create, 'register', { userId: user.id });

  return build();
};
