import type { AuthProvider } from '@prisma/client';
import { prisma } from '../../config/database';
import { AUTH_PROVIDER_NAME } from '../../enums/prisma.enum';
import { HTTP_RESPONSE_CODE } from '../../enums/response.enum';
import { authService } from '../../services/index';

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));

describe('Auth Service (Current year: 2024)', () => {
  describe('getAuthProvider', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return list of auth provider successful', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockAuthProvider: AuthProvider = {
        id: '11111111-1111-1111-1111-111111111112',
        userId,
        authProvider: AUTH_PROVIDER_NAME.GOOGLE,
        providerUserId: '111111111111111111111',
        providerEmail: 'test@gmail.com',
        linkedAt: new Date(),
      };
      const expected = [
        {
          id: '11111111-1111-1111-1111-111111111112',
          userId,
          authProvider: AUTH_PROVIDER_NAME.GOOGLE,
          providerUserId: '111111111111111111111',
          providerEmail: 'test@gmail.com',
          linkedAt: new Date(),
        },
      ];

      jest.spyOn(prisma.authProvider, 'findMany').mockResolvedValue([mockAuthProvider]);

      const result = await authService.getAuthProvider(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return blank list of auth provider successful when no auth provider', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';

      jest.spyOn(prisma.authProvider, 'findMany').mockResolvedValue([]);

      const result = await authService.getAuthProvider(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual([]);
    });
    it('should return error 500 when database connection has problem', async () => {
      jest.spyOn(prisma.authProvider, 'findMany').mockRejectedValue(null);

      const userId = '21111111-1111-1111-1111-111111111111';
      const result = await authService.getAuthProvider(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect(result.data).toStrictEqual(null);
    });
  });
});
