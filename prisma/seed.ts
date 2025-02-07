import { PrismaClient, USER_STATUS, POLICY_TYPE } from '@prisma/client';
import loggerService from '../src/services/logger.service';
import { hashPassword } from '../src/utils/hashing';
import {
  initEmailMarketingPolicyContent,
  initPrivacyPolicyContent,
  initTermsOfServicesPolicyContent,
} from './policyContent';

const prisma = new PrismaClient();

const seed = async () => {
  try {
    const users = [
      {
        id: '344e70a7-9d79-4579-b83b-80060d2b95c5',
        name: 'John Doe',
        username: 'johndoe',
        password: await hashPassword('Password1'),
        email: 'john@email.com',
        status: USER_STATUS.ACTIVATED,
      },
      {
        id: 'ddc3fb92-62c4-4232-81b2-38b1ff0a3333',
        name: 'Jane Smith',
        username: 'janesmith',
        password: await hashPassword('Password1'),
        email: 'jane@email.com',
        status: USER_STATUS.ACTIVATED,
      },
    ];
    const userProcesses = users.map((user) =>
      prisma.user.upsert({
        where: {
          email: user.email,
        },
        update: user,
        create: user,
      }),
    );

    const policies = [
      {
        id: '62fcc924-5674-4080-9467-6ff6893b3ef0',
        type: POLICY_TYPE.TERMOFSERVICES,
        content: initTermsOfServicesPolicyContent,
        version: '1.0.0',
      },
      {
        id: 'c27622ed-62d9-4949-be34-45106146d68e',
        type: POLICY_TYPE.PRIVATE,
        content: initPrivacyPolicyContent,
        version: '1.0.0',
      },
      {
        id: '3c286a09-bcbd-460f-8c93-f39e6afca4da',
        type: POLICY_TYPE.EMAILMARKETING,
        content: initEmailMarketingPolicyContent,
        version: '1.0.0',
      },
    ];
    const policyProcesses = policies.map((policy) =>
      prisma.policy.upsert({
        where: {
          id: policy.id,
        },
        update: policy,
        create: policy,
      }),
    );

    const userPolicies = [
      {
        id: 'b68d9190-9cb9-41a7-84a3-bc5e3acf5eef',
        userId: '344e70a7-9d79-4579-b83b-80060d2b95c5',
        policyId: '62fcc924-5674-4080-9467-6ff6893b3ef0',
      },
      {
        id: '6048e5f7-5bf6-4969-a75d-43807d649f02',
        userId: '344e70a7-9d79-4579-b83b-80060d2b95c5',
        policyId: 'c27622ed-62d9-4949-be34-45106146d68e',
      },
      {
        id: '902be6f9-cc5c-4e82-b598-01c400f95f58',
        userId: 'ddc3fb92-62c4-4232-81b2-38b1ff0a3333',
        policyId: '62fcc924-5674-4080-9467-6ff6893b3ef0',
      },
      {
        id: '40c67910-24a8-4d87-8e67-aa1783b45904',
        userId: 'ddc3fb92-62c4-4232-81b2-38b1ff0a3333',
        policyId: 'c27622ed-62d9-4949-be34-45106146d68e',
      },
    ];
    const userPolicyProcesses = userPolicies.map((userPolicy) =>
      prisma.userPolicy.upsert({
        where: {
          id: userPolicy.id,
        },
        update: userPolicy,
        create: userPolicy,
      }),
    );

    await prisma.$transaction([...userProcesses, ...policyProcesses, ...userPolicyProcesses]);
  } catch (error: any) {
    loggerService.error(error);
  } finally {
    await prisma.$disconnect();
  }
};

seed();
