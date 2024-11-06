import { prisma } from '../../config/database';
import { HTTP_RESPONSE_CODE } from '../../enums/response.enum';
import { RecordNotFoundError } from '../../errors';
import { UserType } from '../../types/users.type';
import { userService } from '../../services/index';

jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('User Service', () => {
  describe('getUserById', () => {
    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    it('should return user data when user exists', async () => {
      const userId = 'adbe1b9a-562d-4554-bea4-e6ae35f3b00b';

      const mockUser: UserType = {
        id: 'adbe1b9a-562d-4554-bea4-e6ae35f3b00b',
        name: 'John Doe',
        phoneNumber: '1234567890',
        bio: 'Software Developer',
        username: 'johndoe',
        email: 'johndoe@example.com',
        profileImageUrl: 'http://example.com/profile.jpg',
        status: 'ACTIVATED',
        createdAt: new Date('2024-11-01T00:00:00Z'),
        updatedAt: new Date('2024-11-01T00:00:00Z'),
      };

      const expectedResult: UserType = {
        id: 'adbe1b9a-562d-4554-bea4-e6ae35f3b00b',
        name: 'John Doe',
        phoneNumber: '1234567890',
        bio: 'Software Developer',
        username: 'johndoe',
        email: 'johndoe@example.com',
        profileImageUrl: 'http://example.com/profile.jpg',
        status: 'ACTIVATED',
        createdAt: new Date('2024-11-01T00:00:00Z'),
        updatedAt: new Date('2024-11-01T00:00:00Z'),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          bio: true,
          username: true,
          email: true,
          profileImageUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expectedResult);
    });

    it('should return error code 404 when user does not exist', async () => {
      const userId = 'adbe1b9a-562d-4554-bea4-e6ae35f3b001';
      const expectedResult = new RecordNotFoundError('User not found');

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userService.getUserById(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          bio: true,
          username: true,
          email: true,
          profileImageUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
      expect(result.data).toStrictEqual(expectedResult);
    });

    it('should return error code 500 when database query fails', async () => {
      const userId = 'adbe1b9a-562d-4554-bea4-e6ae35f3b00b';
      const mockError = new Error('Database error');
      const expectedResult = new Error('Database error');

      (prisma.user.findUnique as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await userService.getUserById(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          bio: true,
          username: true,
          email: true,
          profileImageUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect(result.data).toStrictEqual(expectedResult);
    });
  });
});
