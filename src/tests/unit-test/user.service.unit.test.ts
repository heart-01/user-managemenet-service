import type { User } from '@prisma/client';
import { USER_STATUS } from '../../enums/prisma.enum';
import { prisma } from '../../config/database';
import { HTTP_RESPONSE_CODE } from '../../enums/response.enum';
import { userService } from '../../services/index';
import { UpdateUserBodyType } from '../../types/users.type';
import { hashPassword, verifyPassword } from '../../utils/hashing';

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));
jest.mock('../../utils/hashing', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
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
      const expected = true;

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await userService.checkUsername(username);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return false when username does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const username = 'noExistingUser';
      const expected = false;
      const result = await userService.checkUsername(username);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return error 500 when database connection has problem', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockRejectedValue(null);

      const username = 'existingUser';
      const result = await userService.checkUsername(username);
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

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(false);
      (hashPassword as jest.Mock).mockResolvedValue('****');
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUser(userId, data);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });
    it('should return error 404 when data not found', async () => {
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
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const data: UpdateUserBodyType = {
        username: 'test',
      };
      const result = await userService.updateUser(userId, data);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CONFLICT);
    });
    it('should return error 409 when username already exists', async () => {
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
});
