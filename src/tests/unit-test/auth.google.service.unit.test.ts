import type { AuthProvider, Policy } from '@prisma/client';
import { prisma } from '../../config/database';
import { googleClient } from '../../config/googleAuth';
import { HTTP_RESPONSE_CODE } from '../../enums/response.enum';
import { AUTH_PROVIDER_NAME, POLICY_TYPE, USER_STATUS } from '../../enums/prisma.enum';
import { authGoogleService } from '../../services/index';
import type { AuthResponseType } from '../../types/auth.type';
import { UserType } from '../../types/users.type';
import { generateToken } from '../../utils/token';

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));
jest.mock('../../config/googleAuth', () => ({
  googleClient: {
    verifyIdToken: jest.fn(),
  },
}));
const prismaTransactionMock = {
  user: { create: jest.fn() },
  authProvider: { create: jest.fn() },
  policy: { findMany: jest.fn() },
  userPolicy: { createMany: jest.fn() },
};
jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    authProvider: {
      findUnique: jest.fn(),
    },
    policy: {
      findMany: jest.fn(),
    },
  },
  runTransaction: jest.fn().mockImplementation((callback) => callback(prismaTransactionMock)),
}));
jest.mock('../../utils/token', () => ({
  generateToken: jest.fn(),
}));

describe('Auth Google Service (Current year: 2024)', () => {
  describe('login', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return new user access token by google successful', async () => {
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
      const mockPolicies: Policy[] = [
        {
          id: '31111111-1111-1111-1111-111111111111',
          content: 'Termofservices policy',
          type: POLICY_TYPE.TERMOFSERVICES,
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
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
          username: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          latestLoginAt: new Date(),
        },
      };

      (googleClient.verifyIdToken as jest.Mock).mockResolvedValue({
        getPayload: () => ({
          sub: 'test',
          name: 'test',
          email: 'test@gmail.com',
        }),
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.authProvider.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaTransactionMock.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prismaTransactionMock.authProvider.create as jest.Mock).mockResolvedValue(null);
      (prismaTransactionMock.policy.findMany as jest.Mock).mockResolvedValue(mockPolicies);
      (prismaTransactionMock.userPolicy.createMany as jest.Mock).mockResolvedValue(null);
      (generateToken as jest.Mock).mockReturnValue('accessToken');

      const result = await authGoogleService.login('token');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return user access token by google successful', async () => {
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
      const mockAuthProvider: AuthProvider = {
        id: '21111111-1111-1111-1111-111111111111',
        userId,
        authProvider: AUTH_PROVIDER_NAME.GOOGLE,
        providerEmail: 'test@gmail.com',
        providerUserId: '11111111-1111-1111-1111-111111111112',
        linkedAt: new Date(),
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

      (googleClient.verifyIdToken as jest.Mock).mockResolvedValue({
        getPayload: () => ({
          sub: 'test',
          name: 'test',
          email: 'test@gmail.com',
        }),
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.authProvider.findUnique as jest.Mock).mockResolvedValue(mockAuthProvider);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (generateToken as jest.Mock).mockReturnValue('accessToken');

      const result = await authGoogleService.login('token');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return error 409 when user already unlink provider(google) but signin by provider(google)', async () => {
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

      (googleClient.verifyIdToken as jest.Mock).mockResolvedValue({
        getPayload: () => ({
          sub: 'test',
          name: 'test',
          email: 'test@gmail.com',
        }),
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.authProvider.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authGoogleService.login('token');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CONFLICT);
    });

    it('should return error 401 when system get payload from provider(google) is incorrect', async () => {
      (googleClient.verifyIdToken as jest.Mock).mockResolvedValue({
        getPayload: () => ({
          sub: null,
          name: null,
          email: null,
        }),
      });

      const result = await authGoogleService.login('token');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.UNAUTHORIZED);
    });

    it('should return error 401 when', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockAuthProvider: AuthProvider = {
        id: '21111111-1111-1111-1111-111111111111',
        userId,
        authProvider: AUTH_PROVIDER_NAME.GOOGLE,
        providerEmail: 'test@gmail.com',
        providerUserId: '11111111-1111-1111-1111-111111111112',
        linkedAt: new Date(),
      };
      (googleClient.verifyIdToken as jest.Mock).mockResolvedValue({
        getPayload: () => ({
          sub: 'test',
          name: 'test',
          email: 'test@test.com',
        }),
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.authProvider.findUnique as jest.Mock).mockResolvedValue(mockAuthProvider);

      const result = await authGoogleService.login('token');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.UNAUTHORIZED);
    });

    it('should return error 500 when database connection has problem', async () => {
      (googleClient.verifyIdToken as jest.Mock).mockResolvedValue({
        getPayload: () => ({
          sub: 'test',
          name: 'test',
          email: 'test@gmail.com',
        }),
      });
      (prisma.user.findUnique as jest.Mock).mockRejectedValue({ message: 'error' });

      const result = await authGoogleService.login('token');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
    });
  });
});
