import { Response, NextFunction } from 'express';
import { subject } from '@casl/ability';
import { defineAbilitiesFor } from '../config/ability';
import { AuthRequest } from '../types/auth.type';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { UserType } from '../types/users.type';
import { Actions } from '../enums/ability.enum';
import { AppSubjects } from '../types/ability.type';

export const authorizeMiddleware =
  (action: Actions, resource: AppSubjects) =>
  (request: AuthRequest, response: Response, next: NextFunction) => {
    const resourceData = { ...request.params, ...request.body };
    const subjectData = { ...resourceData };

    const ability = defineAbilitiesFor(request.user as UserType);
    const permitted = ability.can(action, subject(resource as string, subjectData) as any);

    if (!permitted) {
      const resourceUrl = request.originalUrl;
      response
        .status(HTTP_RESPONSE_CODE.FORBIDDEN)
        .send(`You are not allowed to ${action} on ${resourceUrl}`);
      return;
    }

    next();
  };
