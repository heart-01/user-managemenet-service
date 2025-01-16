import type { Policy } from '@prisma/client';
import { prisma } from '../../config/database';
import { POLICY_TYPE } from '../../enums/prisma.enum';
import { HTTP_RESPONSE_CODE } from '../../enums/response.enum';
import { policyService } from '../../services/index';

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));

describe('Policy Service (Current year: 2024)', () => {
  describe('getUserById', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return list policy successful', async () => {
      const mockPolicies: Policy[] = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          content: 'Termofservices policy',
          type: POLICY_TYPE.TERMOFSERVICES,
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const expected: Policy[] = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          content: 'Termofservices policy',
          type: POLICY_TYPE.TERMOFSERVICES,
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(prisma.policy, 'findMany').mockResolvedValue(mockPolicies);

      const result = await policyService.getPolicy();
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual(expected);
    });

    it('should return blank policy successful', async () => {
      jest.spyOn(prisma.policy, 'findMany').mockResolvedValue([]);

      const result = await policyService.getPolicy();
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.OK);
      expect(result.data).toStrictEqual([]);
    });
    it('should return error 500 when database connection has problem', async () => {
      jest.spyOn(prisma.policy, 'findMany').mockRejectedValue(null);

      const result = await policyService.getPolicy();
      expect(result.status).toStrictEqual(HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR);
      expect(result.data).toStrictEqual(null);
    });
  });
});
