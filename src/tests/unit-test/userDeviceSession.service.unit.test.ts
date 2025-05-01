import type { UserDeviceSession } from '@prisma/client';
import { prisma } from '../../config/database';
import { HTTP_RESPONSE_CODE } from '../../enums/response.enum';
import { RecordNotFoundError, ResponseError } from '../../errors';
import userDeviceSessionService from '../../services/userDeviceSession.service';
import { sendEmailWithTemplate } from '../../utils/email';

jest.mock('../../utils/email', () => ({
  sendEmailWithTemplate: jest.fn(),
}));

describe('User Device Session Service (Current year: 2025)', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('upsertUserDeviceSession', () => {
    it('should update existing session and return OK when successfully', async () => {
      const email = 'test@example.com';
      const mockUserDeviceSession: UserDeviceSession = {
        id: '2b384498-096c-45cf-9665-0168095a184d',
        userId: '11111111-1111-1111-1111-111111111111',
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
        lastActiveAt: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      const mockUserDeviceSessionUpdated: UserDeviceSession = {
        id: '2b384498-096c-45cf-9665-0168095a184d',
        userId: '11111111-1111-1111-1111-111111111111',
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
        lastActiveAt: new Date('2024-01-01T01:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      const expected: UserDeviceSession = {
        id: '2b384498-096c-45cf-9665-0168095a184d',
        userId: '11111111-1111-1111-1111-111111111111',
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
        lastActiveAt: new Date('2024-01-01T01:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };

      jest.spyOn(prisma.userDeviceSession, 'findFirst').mockResolvedValue(mockUserDeviceSession);
      jest
        .spyOn(prisma.userDeviceSession, 'update')
        .mockResolvedValue(mockUserDeviceSessionUpdated);
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await userDeviceSessionService.upsertUserDeviceSession(email, {
        userId: '11111111-1111-1111-1111-111111111111',
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
      });

      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });
    it('should create new session, send email and return CREATED', async () => {
      const email = 'test@example.com';
      const mockUserDeviceSession: UserDeviceSession = {
        id: '2b384498-096c-45cf-9665-0168095a184d',
        userId: '11111111-1111-1111-1111-111111111111',
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
        lastActiveAt: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      const expected: UserDeviceSession = {
        id: '2b384498-096c-45cf-9665-0168095a184d',
        userId: '11111111-1111-1111-1111-111111111111',
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
        lastActiveAt: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };

      jest.spyOn(prisma.userDeviceSession, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.userDeviceSession, 'create').mockResolvedValue(mockUserDeviceSession);
      (sendEmailWithTemplate as jest.Mock).mockResolvedValue(null);

      const result = await userDeviceSessionService.upsertUserDeviceSession(email, {
        userId: '11111111-1111-1111-1111-111111111111',
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
      });

      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.CREATED);
      expect(result.data).toStrictEqual(expected);
    });
    it('should return error 500 when database connection has problem', async () => {
      const email = 'test@example.com';
      jest
        .spyOn(prisma.userDeviceSession, 'findFirst')
        .mockRejectedValue(new Error('Database error'));
      const result = await userDeviceSessionService.upsertUserDeviceSession(email, {
        userId: '11111111-1111-1111-1111-111111111111',
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
      });
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect((result.data as ResponseError).message).toStrictEqual('Database error');
    });
  });

  describe('countActiveSessions', () => {
    it('should return count and OK', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      jest.spyOn(prisma.userDeviceSession, 'count').mockResolvedValue(1);
      const result = await userDeviceSessionService.countActiveSessions(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(1);
    });
    it('should return error 500 when database connection has problem', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      jest.spyOn(prisma.userDeviceSession, 'count').mockRejectedValue(new Error('Database error'));
      const result = await userDeviceSessionService.countActiveSessions(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect((result.data as ResponseError).message).toStrictEqual('Database error');
    });
  });

  describe('listActiveSessions', () => {
    it('should return array of sessions and OK', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const mockUserDeviceSession: UserDeviceSession[] = [
        {
          id: '2b384498-096c-45cf-9665-0168095a184d',
          userId,
          deviceId: 'd123',
          deviceName: 'Chrome',
          ipAddress: '127.0.0.1',
          lastActiveAt: new Date('2024-01-01T00:00:00Z'),
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];
      const expected: UserDeviceSession[] = [
        {
          id: '2b384498-096c-45cf-9665-0168095a184d',
          userId,
          deviceId: 'd123',
          deviceName: 'Chrome',
          ipAddress: '127.0.0.1',
          lastActiveAt: new Date('2024-01-01T00:00:00Z'),
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];
      jest.spyOn(prisma.userDeviceSession, 'findMany').mockResolvedValue(mockUserDeviceSession);
      const result = await userDeviceSessionService.listActiveSessions(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });
    it('should return error 500 when database connection has problem', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      jest
        .spyOn(prisma.userDeviceSession, 'findMany')
        .mockRejectedValue(new Error('Database error'));
      const result = await userDeviceSessionService.listActiveSessions(userId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect((result.data as ResponseError).message).toStrictEqual('Database error');
    });
  });

  describe('getDeviceId', () => {
    it('should return session and OK when found', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const deviceId = 'd123';
      const mockUserDeviceSession: UserDeviceSession = {
        id: '2b384498-096c-45cf-9665-0168095a184d',
        userId,
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
        lastActiveAt: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      const expected: UserDeviceSession = {
        id: '2b384498-096c-45cf-9665-0168095a184d',
        userId,
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
        lastActiveAt: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      jest.spyOn(prisma.userDeviceSession, 'findFirst').mockResolvedValue(mockUserDeviceSession);
      const result = await userDeviceSessionService.getDeviceId(userId, deviceId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return 404 when not found', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const deviceId = 'd123';
      jest.spyOn(prisma.userDeviceSession, 'findFirst').mockResolvedValue(null);
      const result = await userDeviceSessionService.getDeviceId(userId, deviceId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
      expect(result.data).toStrictEqual(
        new RecordNotFoundError(
          `UserDeviceSession userId ${userId} with deviceId ${deviceId} not found`,
        ),
      );
    });
    it('should return error 500 when database connection has problem', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const deviceId = 'd123';
      jest
        .spyOn(prisma.userDeviceSession, 'findFirst')
        .mockRejectedValue(new Error('Database error'));
      const result = await userDeviceSessionService.getDeviceId(userId, deviceId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect((result.data as ResponseError).message).toStrictEqual('Database error');
    });
  });

  describe('revokeSession', () => {
    it('should delete session and return OK when successfully', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const deviceId = 'd123';
      const mockUserDeviceSession: UserDeviceSession = {
        id: '2b384498-096c-45cf-9665-0168095a184d',
        userId,
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
        lastActiveAt: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      const expected: UserDeviceSession = {
        id: '2b384498-096c-45cf-9665-0168095a184d',
        userId,
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
        lastActiveAt: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      jest.spyOn(prisma.userDeviceSession, 'findFirst').mockResolvedValue(mockUserDeviceSession);
      jest.spyOn(prisma.userDeviceSession, 'delete').mockResolvedValue(mockUserDeviceSession);

      const result = await userDeviceSessionService.revokeSession(userId, deviceId);
      expect(result.status).toBe(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toEqual(expected);
    });
    it('should return 404 when session not found', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const deviceId = 'd123';
      jest.spyOn(prisma.userDeviceSession, 'findFirst').mockResolvedValue(null);
      const result = await userDeviceSessionService.revokeSession(userId, deviceId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.NOT_FOUND);
      expect(result.data).toStrictEqual(
        new RecordNotFoundError(
          `UserDeviceSession userId ${userId} with deviceId ${deviceId} not found`,
        ),
      );
    });
    it('should return error 500 when database connection has problem', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const deviceId = 'd123';
      jest
        .spyOn(prisma.userDeviceSession, 'findFirst')
        .mockRejectedValue(new Error('Database error'));
      const result = await userDeviceSessionService.revokeSession(userId, deviceId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect((result.data as ResponseError).message).toStrictEqual('Database error');
    });
  });
  describe('updateUserDeviceSessionActive', () => {
    it('should array session and return OK when successfully', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const deviceId = 'd123';
      const mockUserDeviceSessionFindFirst: UserDeviceSession = {
        id: '2b384498-096c-45cf-9665-0168095a184d',
        userId,
        deviceId: 'd123',
        deviceName: 'Chrome',
        ipAddress: '127.0.0.1',
        lastActiveAt: new Date('2024-01-01T00:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      const mockUserDeviceSession: UserDeviceSession[] = [
        {
          id: '2b384498-096c-45cf-9665-0168095a184d',
          userId,
          deviceId: 'd123',
          deviceName: 'Chrome',
          ipAddress: '127.0.0.1',
          lastActiveAt: new Date('2024-01-01T00:00:00Z'),
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];
      const expected: UserDeviceSession[] = [
        {
          id: '2b384498-096c-45cf-9665-0168095a184d',
          userId,
          deviceId: 'd123',
          deviceName: 'Chrome',
          ipAddress: '127.0.0.1',
          lastActiveAt: new Date('2024-01-01T00:00:00Z'),
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];
      jest
        .spyOn(prisma.userDeviceSession, 'findFirst')
        .mockResolvedValue(mockUserDeviceSessionFindFirst);
      jest
        .spyOn(prisma.userDeviceSession, 'update')
        .mockResolvedValue(mockUserDeviceSessionFindFirst);
      jest.spyOn(prisma.userDeviceSession, 'findMany').mockResolvedValue(mockUserDeviceSession);

      const result = await userDeviceSessionService.updateUserDeviceSessionActive(userId, deviceId);
      expect(result.status).toBe(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toEqual(expected);
    });
    it('should return 404 when session not found', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const deviceId = 'd123';
      const mockUserDeviceSessionFindMany: UserDeviceSession[] = [
        {
          id: '2b384498-096c-45cf-9665-0168095a184d',
          userId,
          deviceId: 'd123',
          deviceName: 'Chrome',
          ipAddress: '127.0.0.1',
          lastActiveAt: new Date('2024-01-01T00:00:00Z'),
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];
      jest.spyOn(prisma.userDeviceSession, 'findFirst').mockResolvedValue(null);
      jest
        .spyOn(prisma.userDeviceSession, 'findMany')
        .mockResolvedValue(mockUserDeviceSessionFindMany);
      const result = await userDeviceSessionService.updateUserDeviceSessionActive(userId, deviceId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.SESSION_EXPIRED);
      expect(result.data).toStrictEqual(
        new RecordNotFoundError(
          `UserDeviceSession userId ${userId} with deviceId ${deviceId} not found. Current sessions: [${mockUserDeviceSessionFindMany[0].deviceName} - ${mockUserDeviceSessionFindMany[0].ipAddress}]`,
        ),
      );
    });
    it('should return error 500 when database connection has problem', async () => {
      const userId = '11111111-1111-1111-1111-111111111111';
      const deviceId = 'd123';
      jest
        .spyOn(prisma.userDeviceSession, 'findFirst')
        .mockRejectedValue(new Error('Database error'));
      const result = await userDeviceSessionService.updateUserDeviceSessionActive(userId, deviceId);
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect((result.data as ResponseError).message).toStrictEqual('Database error');
    });
  });
});
