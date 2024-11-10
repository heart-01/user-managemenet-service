import { Request } from 'express';
import { UserType } from './users.type';

interface AuthRequest extends Request {
  user?: UserType;
}

export type { AuthRequest };
