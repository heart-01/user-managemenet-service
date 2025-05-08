import type {
  EmailVerification,
  ForbiddenUsername,
  User,
  UserDeletionFeedback,
  UsernameChangeHistory,
} from '@prisma/client';
import { EMAIL_VERIFICATION_ACTION_TYPE, USER_STATUS } from '../../enums/prisma.enum';
import { prisma } from '../../config/database';
import { HTTP_RESPONSE_CODE } from '../../enums/response.enum';
import { userService } from '../../services/index';
import { UpdateUserBodyType } from '../../types/users.type';
import { hashPassword, verifyPassword } from '../../utils/hashing';
import { generateToken } from '../../utils/token';
import {
  generateUrlEmailVerifyDeleteAccount,
  generateUrlRedirectHome,
  sendEmailWithTemplate,
} from '../../utils/email';

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));
jest.mock('../../utils/hashing', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));
jest.mock('../../utils/token', () => ({
  generateToken: jest.fn(),
}));
jest.mock('../../utils/email', () => ({
  generateUrlEmailVerifyDeleteAccount: jest.fn(),
  generateUrlRedirectHome: jest.fn(),
  sendEmailWithTemplate: jest.fn(),
}));

describe('User Service (Current year: 2024)', () => {
  describe('getUserById', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return user successful', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };
      const expected = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return error 404 when data not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const userId = '21111111-1111-1111-1111-111111111111';
      const result = await userService.getUserById(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
    });
    it('should return error 500 when database connection has problem', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue(null);

      const userId = '21111111-1111-1111-1111-111111111111';
      const result = await userService.getUserById(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect(result.data).toStrictEqual(null);
    });
  });

  describe('checkUsername', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return true when username exists', async () => {
      const userId = '11111111-1111-1111-1111-111111111113';
      const username = 'existingUser';
      const mockUser: User = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: 'existingUser',
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };
      const expected = {
        isValid: true,
        changeCount: 0,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.forbiddenUsername, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usernameChangeHistory, 'count').mockResolvedValue(0);

      const result = await userService.checkUsername(username, userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });
    it('should return true when username forbidden', async () => {
      const userId = '11111111-1111-1111-1111-111111111113';
      const username = 'admin';
      const mockUser: User = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: 'existingUser',
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };
      const mockUserForbidden: ForbiddenUsername = {
        id: '11111111-1111-1111-1111-111111111112',
        username: 'admin',
        createdAt: new Date(),
      };
      const expected = {
        isValid: true,
        changeCount: 0,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.forbiddenUsername, 'findUnique').mockResolvedValue(mockUserForbidden);
      jest.spyOn(prisma.usernameChangeHistory, 'count').mockResolvedValue(0);

      const result = await userService.checkUsername(username, userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return false when username does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.forbiddenUsername, 'findUnique').mockResolvedValue(null);

      const userId = '11111111-1111-1111-1111-111111111113';
      const username = 'noExistingUser';
      const expected = {
        isValid: false,
        changeCount: 0,
      };
      const result = await userService.checkUsername(username, userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return error 500 when database connection has problem', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue(null);

      const userId = '11111111-1111-1111-1111-111111111113';
      const username = 'existingUser';
      const result = await userService.checkUsername(username, userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect(result.data).toStrictEqual(null);
    });
  });

  describe('updateUser', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return updated user successful', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const data: UpdateUserBodyType = {
        bio: 'test',
        name: 'test2',
        username: 'test',
        password: 'Abcd1234',
      };
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };
      const mockUpdatedUser: User = {
        id: userId,
        name: 'test2',
        bio: 'test',
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: 'test',
        password: '****',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };
      const mockUsernameChangeHistory: UsernameChangeHistory = {
        id: '22222222-2222-2222-2222-222222222222',
        userId,
        previousUsername: null,
        updatedUsername: 'test',
        changedAt: new Date(),
      };
      const expected = {
        id: userId,
        name: 'test2',
        bio: 'test',
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: 'test',
        password: '****',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };

      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      jest.spyOn(prisma.forbiddenUsername, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usernameChangeHistory, 'count').mockResolvedValue(0);
      (verifyPassword as jest.Mock).mockResolvedValue(false);
      (hashPassword as jest.Mock).mockResolvedValue('****');
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUpdatedUser);
      jest
        .spyOn(prisma.usernameChangeHistory, 'create')
        .mockResolvedValue(mockUsernameChangeHistory);

      const result = await userService.updateUser(userId, data);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });
    it('should return error 409 when username already exists', async () => {
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
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };
      const mockUserAlreadyExists: User = {
        id: '11111111-1111-1111-1111-111111111112',
        name: 'test2',
        bio: null,
        email: 'test2@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: 'test2',
        password: 'test2',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUserAlreadyExists);

      const data: UpdateUserBodyType = {
        username: 'test2',
      };
      const result = await userService.updateUser(userId, data);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CONFLICT);
    });
    it('should return error 409 when username forbidden', async () => {
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
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };
      const mockForbiddenUsername: ForbiddenUsername = {
        id: '11111111-1111-1111-1111-111111111112',
        username: 'admin',
        createdAt: new Date(),
      };
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      jest.spyOn(prisma.forbiddenUsername, 'findUnique').mockResolvedValue(mockForbiddenUsername);

      const data: UpdateUserBodyType = {
        username: 'admin',
      };
      const result = await userService.updateUser(userId, data);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CONFLICT);
    });
    it('should return error 440 when the number of username changes is greater than or equal to 5', async () => {
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
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };

      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      jest.spyOn(prisma.forbiddenUsername, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.usernameChangeHistory, 'count').mockResolvedValue(5);

      const data: UpdateUserBodyType = {
        username: 'hello',
      };
      const result = await userService.updateUser(userId, data);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.LIMIT_USERNAME_CHANGE);
    });
    it('should return error 409 when data not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const userId = '21111111-1111-1111-1111-111111111111';
      const data: UpdateUserBodyType = {
        bio: 'test',
        name: 'test2',
      };
      const result = await userService.updateUser(userId, data);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
    });
    it('should return error 409 when duplicate password', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        password: '****',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(true);

      const data: UpdateUserBodyType = {
        bio: 'test',
        name: 'test2',
        password: 'Abcd1234',
      };
      const result = await userService.updateUser(userId, data);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CONFLICT);
    });
    it('should return error 500 when database connection has problem', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue(null);

      const userId = '11111111-1111-1111-1111-111111111111';
      const data: UpdateUserBodyType = {
        bio: 'test',
        name: 'test2',
      };
      const result = await userService.updateUser(userId, data);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect(result.data).toStrictEqual(null);
    });
  });

  describe('deleteUser', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return deleted user successful', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };
      const mockDeletedUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: new Date(),
      };
      const expected = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockDeletedUser);

      const result = await userService.deleteUser(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });
    it('should return error 404 when data not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const userId = '21111111-1111-1111-1111-111111111111';
      const result = await userService.deleteUser(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
    });

    it('should return error 500 when database connection has problem', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue(null);

      const userId = '11111111-1111-1111-1111-111111111111';
      const result = await userService.deleteUser(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect(result.data).toStrictEqual(null);
    });
  });

  describe('userDeletionFeedback', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create deletion‑feedback successfully', async () => {
      const userId = '11111111‑1111‑1111‑1111‑111111111111';
      const reason = 'no longer need account';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        password: '****',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };
      const mockFeedback: UserDeletionFeedback = {
        id: '22222222‑2222‑2222‑2222‑222222222222',
        userId,
        reason,
        createdAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.userDeletionFeedback, 'create').mockResolvedValue(mockFeedback);
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await userService.userDeletionFeedback(userId, reason);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(mockFeedback);
    });

    it('should return 404 when user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      const result = await userService.userDeletionFeedback(
        '33333333‑3333‑3333‑3333‑333333333333',
        'bye',
      );
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
      expect(result.data).toBeInstanceOf(Error);
    });

    it('should return 500 when database throws', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue(new Error('DB'));
      const result = await userService.userDeletionFeedback(
        '44444444‑4444‑4444‑4444‑444444444444',
        'error case',
      );
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect(result.data).toBeInstanceOf(Error);
    });
  });

  describe('sendEmailDeleteAccount', () => {
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
        deletedAt: null,
      };
      const mockEmailVerification: EmailVerification = {
        userId,
        type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date('2023-12-31'),
      };
      const mockNewEmailVerification: EmailVerification = {
        userId,
        type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };
      const expected: EmailVerification = {
        userId,
        type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(mockEmailVerification);
      (generateToken as jest.Mock).mockReturnValue('accessToken');
      jest.spyOn(prisma.emailVerification, 'create').mockResolvedValue(mockNewEmailVerification);
      (generateUrlEmailVerifyDeleteAccount as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await userService.sendEmailDeleteAccount('test@test.com');
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
        deletedAt: null,
      };
      const mockEmailVerification: EmailVerification = {
        userId,
        type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
        token: 'token',
        createdAt: new Date(),
        completedAt: new Date(),
        expiredAt: new Date(),
      };
      const mockNewEmailVerification: EmailVerification = {
        userId,
        type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };
      const expected: EmailVerification = {
        userId,
        type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(mockEmailVerification);
      (generateToken as jest.Mock).mockReturnValue('accessToken');
      jest.spyOn(prisma.emailVerification, 'create').mockResolvedValue(mockNewEmailVerification);
      (generateUrlEmailVerifyDeleteAccount as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await userService.sendEmailDeleteAccount('test@test.com');
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
        deletedAt: null,
      };
      const mockNewEmailVerification: EmailVerification = {
        userId,
        type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };
      const expected: EmailVerification = {
        userId,
        type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
        token: 'token-2',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(null);
      (generateToken as jest.Mock).mockReturnValue('accessToken');
      jest.spyOn(prisma.emailVerification, 'create').mockResolvedValue(mockNewEmailVerification);
      (generateUrlEmailVerifyDeleteAccount as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await userService.sendEmailDeleteAccount('test@test.com');
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
        deletedAt: null,
      };
      const mockEmailVerification: EmailVerification = {
        userId,
        type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };
      const expected: EmailVerification = {
        userId,
        type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
        token: 'token',
        createdAt: new Date(),
        completedAt: null,
        expiredAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.emailVerification, 'findFirst').mockResolvedValue(mockEmailVerification);
      (generateToken as jest.Mock).mockReturnValue('accessToken');
      (generateUrlEmailVerifyDeleteAccount as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await userService.sendEmailDeleteAccount('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CREATED);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return error 404 when no user in database or user status is pending', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await userService.sendEmailDeleteAccount('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
    });

    it('should return error 500 when database connection has problem', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue({ message: 'error' });

      const result = await userService.sendEmailDeleteAccount('test@test.com');
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
    });
  });

  describe('recoverUser', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return recover user successful', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: new Date(),
      };
      const mockDeletedUser: User = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };
      const expected = {
        id: userId,
        name: 'test',
        bio: null,
        email: 'test@test.com',
        imageUrl: null,
        phoneNumber: null,
        status: USER_STATUS.ACTIVATED,
        username: null,
        password: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        latestLoginAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockDeletedUser);
      (generateUrlRedirectHome as jest.Mock).mockReturnValue('url');
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await userService.recoverUser(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return error 404 when data not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const userId = '21111111-1111-1111-1111-111111111111';
      const result = await userService.recoverUser(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
    });

    it('should return error 500 when database connection has problem', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue(null);

      const userId = '11111111-1111-1111-1111-111111111111';
      const result = await userService.recoverUser(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect(result.data).toStrictEqual(null);
    });
  });
});
