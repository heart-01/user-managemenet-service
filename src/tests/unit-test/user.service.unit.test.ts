import type { User } from '@prisma/client';
import { USER_STATUS } from '../../enums/prisma.enum';
import { prisma } from '../../config/database';
import { HTTP_RESPONSE_CODE } from '../../enums/response.enum';
import { userService } from '../../services/index';

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));

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
});
