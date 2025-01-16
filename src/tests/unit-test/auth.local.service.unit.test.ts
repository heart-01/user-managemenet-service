import { verify } from 'jsonwebtoken';
import type { EmailVerification, User } from '@prisma/client';
import { prisma, Prisma } from '../../config/database';
import * as database from '../../config/database';
import { authLocalService } from '../../services/index';
import { HTTP_RESPONSE_CODE } from '../../enums/response.enum';
import { ACTION_TYPE, USER_STATUS } from '../../enums/prisma.enum';
import { generateToken } from '../../utils/token';
import { hashPassword, verifyPassword } from '../../utils/hashing';
import { generateUrlEmailVerifyRegister, sendEmailWithTemplate } from '../../utils/email';
import type {
  AuthResponseType,
  RegisterType,
  ResetPasswordResponseType,
  ResetPasswordType,
  VerifyEmailResponseType,
} from '../../types/auth.type';
import { UserType } from '../../types/users.type';

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));
jest.mock('../../utils/token', () => ({
  generateToken: jest.fn(),
}));
jest.mock('../../utils/hashing', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));
jest.mock('../../utils/email', () => ({
  generateUrlEmailVerifyRegister: jest.fn(),
  generateUrlEmailVerifyResetPassword: jest.fn(),
  sendEmailWithTemplate: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

describe('Auth Local Service (Current year: 2024)', () => {
  describe('login', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return user access token successful', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };
      const expected: AuthResponseType = {
        accessToken: 'accessToken',
        isFirstTimeLogin: false,
        user: {
          id: userId,
          name: 'test',
          bio: null,
          email: 'test@test.com',
          imageUrl: null,
          phoneNumber: null,
          status: USER_STATUS.ACTIVATED,
          username: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          latestLoginAt: new Date(),
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser);
      (generateToken as jest.Mock).mockReturnValue('accessToken');

      const result = await authLocalService.login('test@test.com', '1234');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return error 404 when no user in database', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authLocalService.login('test2@test.com', '1234');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
    });

    it('should return error 409 when user status is pending', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.PENDING,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await authLocalService.login('test@test.com', '1234');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CONFLICT);
    });

    it('should return error 401 when user has no password', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: null,
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await authLocalService.login('test@test.com', '1234');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.UNAUTHORIZED);
    });

    it('should return error 401 when password not match', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(false);

      const result = await authLocalService.login('test@test.com', '12345');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.UNAUTHORIZED);
    });

    it('should return error 500 when database connection has problem', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue({ message: 'error' });

      const result = await authLocalService.login('test@test.com', '1234');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
    });
  });

  describe('sendEmailRegister', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return email verification successful when email verification expired', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.PENDING,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };
      const mockEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.REGISTER,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date('2023-12-31'),
      };
      const mockNewEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.REGISTER,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };
      const expected: EmailVerification = {
        userId,
        type: ACTION_TYPE.REGISTER,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(mockEmailVerification);
      (generateToken as jest.Mock).mockReturnValue('accessToken');
      jest.spyOn(prisma.emailVerification, 'create').mockResolvedValue(mockNewEmailVerification);
      (generateUrlEmailVerifyRegister as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await authLocalService.sendEmailRegister('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CREATED);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return email verification successful when token is completed', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.PENDING,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };
      const mockEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.REGISTER,
        token: 'token',
        createdAt: new Date(),
        completedAt: new Date(),
        expiredAt: new Date(),
      };

      const mockNewEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.REGISTER,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: new Date(),
        expiredAt: new Date(),
      };
      const expected: EmailVerification = {
        userId,
        type: ACTION_TYPE.REGISTER,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: new Date(),
        expiredAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(mockEmailVerification);
      (generateToken as jest.Mock).mockReturnValue('accessToken');
      jest.spyOn(prisma.emailVerification, 'create').mockResolvedValue(mockNewEmailVerification);
      (generateUrlEmailVerifyRegister as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await authLocalService.sendEmailRegister('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CREATED);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return email verification successful when resend email verification', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.PENDING,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };
      const mockEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.REGISTER,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };
      const expected: EmailVerification = {
        userId,
        type: ACTION_TYPE.REGISTER,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(mockEmailVerification);
      (generateToken as jest.Mock).mockReturnValue('accessToken');
      (generateUrlEmailVerifyRegister as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await authLocalService.sendEmailRegister('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CREATED);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return email verification successful when user has not registered before', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.PENDING,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };
      const mockEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.REGISTER,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };
      const expected: EmailVerification = {
        userId,
        type: ACTION_TYPE.REGISTER,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);
      jest.spyOn(prisma.emailVerification, 'create').mockResolvedValue(mockEmailVerification);
      (generateToken as jest.Mock).mockReturnValue('accessToken');
      (generateUrlEmailVerifyRegister as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await authLocalService.sendEmailRegister('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CREATED);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return error 409 when user has registered before', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await authLocalService.sendEmailRegister('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CONFLICT);
    });

    it('should return error 500 when database connection has problem', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue({ message: 'error' });

      const result = await authLocalService.sendEmailRegister('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
    });
  });

  describe('verifyEmail', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return token verify email successful', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockPayloadTokenVerifyEmail = {
        id: userId,
        token: 'token',
      };
      const mockEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.REGISTER,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date('2024-01-02'),
      };
      const expected: VerifyEmailResponseType = {
        token: 'token',
        userId,
      };

      (verify as jest.Mock).mockReturnValue(mockPayloadTokenVerifyEmail);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(mockEmailVerification);
      jest.spyOn(prisma.emailVerification, 'update').mockResolvedValue(mockEmailVerification);

      const result = await authLocalService.verifyEmail('token', ACTION_TYPE.REGISTER);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CREATED);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return error 401 when token verify email not found', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockPayloadTokenVerifyEmail = {
        id: userId,
        token: 'token-2',
      };

      (verify as jest.Mock).mockReturnValue(mockPayloadTokenVerifyEmail);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(null);

      const result = await authLocalService.verifyEmail('token', ACTION_TYPE.REGISTER);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.UNAUTHORIZED);
    });

    it('should return error 401 when email verification is expired', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockPayloadTokenVerifyEmail = {
        id: userId,
        token: 'token',
      };
      const mockEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.REGISTER,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date('2023-12-31'),
      };

      (verify as jest.Mock).mockReturnValue(mockPayloadTokenVerifyEmail);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(mockEmailVerification);

      const result = await authLocalService.verifyEmail('token', ACTION_TYPE.REGISTER);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.UNAUTHORIZED);
    });

    it('should return error 500 when database connection has problem', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockPayloadTokenVerifyEmail = {
        id: userId,
        token: 'token',
      };

      (verify as jest.Mock).mockReturnValue(mockPayloadTokenVerifyEmail);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockRejectedValue({ message: 'error' });

      const result = await authLocalService.verifyEmail('token', ACTION_TYPE.REGISTER);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
    });
  });

  describe('register', () => {
    const prismaTransactionMock = {
      user: { update: jest.fn() },
      userPolicy: { createMany: jest.fn() },
    } as unknown as Prisma.TransactionClient;
    beforeAll(() => {
      jest
        .spyOn(database, 'runTransaction')
        .mockImplementation((callback) => callback(prismaTransactionMock));
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return user access token successful', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUpdatedUser: UserType = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };
      const expected: AuthResponseType = {
        accessToken: 'accessToken',
        isFirstTimeLogin: true,
        user: {
          id: userId,
          name: 'test',
          bio: null,
          email: 'test@test.com',
          imageUrl: null,
          phoneNumber: null,
          status: USER_STATUS.ACTIVATED,
          username: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
          latestLoginAt: new Date(),
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('****');
      (prismaTransactionMock.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);
      (prismaTransactionMock.userPolicy.createMany as jest.Mock).mockResolvedValue(null);
      (generateToken as jest.Mock).mockReturnValue('accessToken');

      const user: RegisterType = {
        userId,
        username: 'test',
        password: '1234',
        confirmPassword: '1234',
        name: 'test',
        userPolicy: ['31111111-1111-1111-1111-111111111111'],
      };
      const result = await authLocalService.register(user);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return error 400 when password and confirm password not match', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const user: RegisterType = {
        userId,
        username: 'test',
        password: '1234',
        confirmPassword: '12345',
        name: 'test',
        userPolicy: ['31111111-1111-1111-1111-111111111111'],
      };
      const result = await authLocalService.register(user);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.BAD_REQUEST);
    });

    it('should return error 409 when username already existed', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: 'test',
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const user: RegisterType = {
        userId,
        username: 'test',
        password: '1234',
        confirmPassword: '1234',
        name: 'test',
        userPolicy: ['31111111-1111-1111-1111-111111111111'],
      };
      const result = await authLocalService.register(user);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CONFLICT);
    });

    it('should return error 409 when updating user but username is not exist', async () => {
      const userId = '21111111-1111-1111-1111-111111111111';
      const mockErrorPrismaUpdate = new Prisma.PrismaClientKnownRequestError('error', {
        clientVersion: 'v1',
        code: 'P2025',
      });

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('****');
      (prismaTransactionMock.user.update as jest.Mock).mockRejectedValue(mockErrorPrismaUpdate);

      const user: RegisterType = {
        userId,
        username: 'test2',
        password: '1234',
        confirmPassword: '1234',
        name: 'test',
        userPolicy: ['31111111-1111-1111-1111-111111111111'],
      };
      const result = await authLocalService.register(user);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
    });

    it('should return error 500 when database connection has problem', async () => {
      const userId = '21111111-1111-1111-1111-111111111111';

      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue({ message: 'error' });

      const user: RegisterType = {
        userId,
        username: 'test',
        password: '1234',
        confirmPassword: '1234',
        name: 'test',
        userPolicy: ['31111111-1111-1111-1111-111111111111'],
      };
      const result = await authLocalService.register(user);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
    });
  });

  describe('sendEmailResetPassword', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return email verification successful when email verification expired', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };
      const mockEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.RESETPASSWORD,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date('2023-12-31'),
      };
      const mockNewEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.RESETPASSWORD,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };
      const expected: EmailVerification = {
        userId,
        type: ACTION_TYPE.RESETPASSWORD,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(mockEmailVerification);
      (generateToken as jest.Mock).mockReturnValue('accessToken');
      jest.spyOn(prisma.emailVerification, 'create').mockResolvedValue(mockNewEmailVerification);
      (generateUrlEmailVerifyRegister as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await authLocalService.sendEmailResetPassword('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CREATED);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return email verification successful when token is completed', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };
      const mockEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.RESETPASSWORD,
        token: 'token',
        createdAt: new Date(),
        completedAt: new Date(),
        expiredAt: new Date(),
      };
      const mockNewEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.RESETPASSWORD,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };
      const expected: EmailVerification = {
        userId,
        type: ACTION_TYPE.RESETPASSWORD,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(mockEmailVerification);
      (generateToken as jest.Mock).mockReturnValue('accessToken');
      jest.spyOn(prisma.emailVerification, 'create').mockResolvedValue(mockNewEmailVerification);
      (generateUrlEmailVerifyRegister as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await authLocalService.sendEmailResetPassword('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CREATED);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return email verification successful when no email verification', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };
      const mockNewEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.RESETPASSWORD,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };
      const expected: EmailVerification = {
        userId,
        type: ACTION_TYPE.RESETPASSWORD,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(null);
      (generateToken as jest.Mock).mockReturnValue('accessToken');
      jest.spyOn(prisma.emailVerification, 'create').mockResolvedValue(mockNewEmailVerification);
      (generateUrlEmailVerifyRegister as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await authLocalService.sendEmailResetPassword('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CREATED);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return email verification successful when resend email verification', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };
      const mockEmailVerification: EmailVerification = {
        userId,
        type: ACTION_TYPE.RESETPASSWORD,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };
      const expected: EmailVerification = {
        userId,
        type: ACTION_TYPE.RESETPASSWORD,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(mockEmailVerification);
      (generateToken as jest.Mock).mockReturnValue('accessToken');
      (generateUrlEmailVerifyRegister as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await authLocalService.sendEmailResetPassword('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CREATED);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return error 409 when user status is pending', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        password: '1234',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.PENDING,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await authLocalService.sendEmailResetPassword('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CONFLICT);
    });

    it('should return error 404 when no user in database', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await authLocalService.sendEmailResetPassword('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
    });

    it('should return error 500 when database connection has problem', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue({ message: 'error' });

      const result = await authLocalService.sendEmailResetPassword('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
    });
  });

  describe('resetPassword', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return user information successful when password updated', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: UserType = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
      };
      const expected: ResetPasswordResponseType = {
        user: {
          id: userId,
          name: 'test',
          bio: null,
          email: 'test@test.com',
          imageUrl: null,
          phoneNumber: null,
          status: USER_STATUS.ACTIVATED,
          username: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          latestLoginAt: new Date(),
        },
      };

      (hashPassword as jest.Mock).mockResolvedValue('****');
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as User);
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);
      const user: ResetPasswordType = {
        userId,
        password: '1234',
        confirmPassword: '1234',
      };
      const result = await authLocalService.resetPassword(user);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return error 400 when password and confirm password not match', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const user: ResetPasswordType = {
        userId,
        password: '1234',
        confirmPassword: '12345',
      };
      const result = await authLocalService.resetPassword(user);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.BAD_REQUEST);
    });

    it('should return error 409 when updating user but user id is not exist', async () => {
      const userId = '21111111-1111-1111-1111-111111111111';
      const mockErrorPrismaUpdate = new Prisma.PrismaClientKnownRequestError('error', {
        clientVersion: 'v1',
        code: 'P2025',
      });

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('****');
      jest.spyOn(prisma.user, 'update').mockRejectedValue(mockErrorPrismaUpdate);

      const user: ResetPasswordType = {
        userId,
        password: '1234',
        confirmPassword: '1234',
      };
      const result = await authLocalService.resetPassword(user);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
    });

    it('should return error 500 when database connection has problem', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';

      jest.spyOn(prisma.user, 'update').mockRejectedValue({ message: 'error' });

      const user: ResetPasswordType = {
        userId,
        password: '1234',
        confirmPassword: '1234',
      };
      const result = await authLocalService.resetPassword(user);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
    });
  });
});
