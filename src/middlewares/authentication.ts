import { verify } from 'jsonwebtoken';
import type { Response, NextFunction } from 'express';
import { loggerService } from '../services';
import { prisma } from '../config/database';
import { JWT_SECRET } from '../config/dotenv';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { UserType } from '../types/users.type';
import { AuthRequest } from '../types/auth.type';

export const authenticateMiddleware = async (
  request: AuthRequest,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = request.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ') && authHeader?.split(' ')[1];
  if (accessToken) {
    try {
      const decoded = verify(accessToken, JWT_SECRET) as UserType;
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        response.status(HTTP_RESPONSE_CODE.UNAUTHORIZED).json({ message: 'Unauthorized' });
        return;
      }
      request.user = user;
      next();
    } catch (error) {
      loggerService.error(error as Error);
      response.status(HTTP_RESPONSE_CODE.UNAUTHORIZED).send('Invalid token');
    }
  } else {
    response.status(HTTP_RESPONSE_CODE.UNAUTHORIZED).json('Invalid token');
  }
};
