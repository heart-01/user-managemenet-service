import { Response, NextFunction } from 'express';
import { subject } from '@casl/ability';
import { Actions, AppSubjects, defineAbilitiesFor } from '../config/ability';
import { AuthRequest } from '../types/auth.type';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { UserType } from '../types/users.type';

export const authorizeMiddleware =
  (action: Actions, resource: AppSubjects) =>
  (request: AuthRequest, response: Response, next: NextFunction) => {
    const resourceData = request.params || request.body;
    const subjectData = { ...resourceData };

    const ability = defineAbilitiesFor(request.user as UserType);
    const permitted = ability.can(action, subject(resource as string, subjectData) as any);

    if (!permitted) {
      response
        .status(HTTP_RESPONSE_CODE.FORBIDDEN)
        .send(`You are not allowed to ${action} on ${resource}`);
      return;
    }

    next();
  };
