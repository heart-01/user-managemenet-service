import { LoginTicket, TokenPayload } from 'google-auth-library';
import { AuthProvider } from '@prisma/client';
import type { SignOptions } from 'jsonwebtoken';
import loggerService from './logger.service';
import authValidator from '../validators/auth.validator';
import { googleClient } from '../config/googleAuth';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  GOOGLE_CLIENT_ID,
  JWT_SECRET,
  SENDGRID_TEMPLATE_LOGIN_DEVICE_EMAIL,
} from '../config/dotenv';
import { prisma, runTransaction } from '../config/database';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { USER_STATUS, AUTH_PROVIDER_NAME } from '../enums/prisma.enum';
import { EMAIL_SUBJECT } from '../enums/email.enum';
import { UserType, UserAuthType } from '../types/users.type';
import { ResponseCommonType } from '../types/common.type';
import { AuthResponseType, PayloadAccessTokenType } from '../types/auth.type';
import { generateToken } from '../utils/token';
import { sendEmailWithTemplate } from '../utils/email';
import {
  AuthProviderMismatchError,
  GoogleIdTokenMissingScopeError,
  ResponseError,
} from '../errors';

const login = async (
  idToken: string,
  device: string | undefined,
): Promise<ResponseCommonType<AuthResponseType | Error>> => {
  try {
    loggerService.info('googleLogin');
    loggerService.debug('token', idToken);

    // Verify idToken
    const loginTicket: LoginTicket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    // Validate payload
    const tokenPayload: TokenPayload | undefined = loginTicket.getPayload();
    const { error: errorUserPayload, value: userPayload } =
      authValidator.userPayloadSchema.validate(tokenPayload);
    if (errorUserPayload) {
      return {
        status: HTTP_RESPONSE_CODE.UNAUTHORIZED,
        data: new GoogleIdTokenMissingScopeError(),
      };
    }

    // Get user and authProvider
    let user = (await prisma.user.findFirst({
      where: {
        AuthProvider: {
          some: {
            providerUserId: userPayload.sub,
          },
        },
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        bio: true,
        username: true,
        email: true,
        imageUrl: true,
        status: true,
        latestLoginAt: true,
        createdAt: true,
        updatedAt: true,
        AuthProvider: true,
      },
    })) as UserAuthType | null;
    if (!user) {
      user = (await prisma.user.findFirst({
        where: {
          email: userPayload.email,
        },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          bio: true,
          username: true,
          email: true,
          imageUrl: true,
          status: true,
          latestLoginAt: true,
          createdAt: true,
          updatedAt: true,
          AuthProvider: true,
        },
      })) as UserAuthType | null;
    }
    const authProvider: AuthProvider | null = user?.AuthProvider?.[0] ?? null;

    // Case user used to login with google before
    if (user && authProvider) {
      // Update latest login time
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          latestLoginAt: new Date(),
        },
      });
      // Send email login device
      await sendEmailWithTemplate({
        to: user.email,
        subject: EMAIL_SUBJECT.LoginDevice,
        templateId: SENDGRID_TEMPLATE_LOGIN_DEVICE_EMAIL,
        dynamicTemplateData: { device },
      });
      const accessToken = generateToken(
        { id: user.id, name: user.name } as PayloadAccessTokenType,
        JWT_SECRET,
        ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
      );
      return {
        status: HTTP_RESPONSE_CODE.OK,
        data: {
          user: {
            id: user.id,
            name: user.name,
            phoneNumber: user.phoneNumber,
            bio: user.bio,
            username: user.username,
            email: user.email,
            imageUrl: user.imageUrl,
            status: user.status,
            latestLoginAt: user.latestLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          } as UserType,
          accessToken,
          isFirstTimeLogin: false,
        },
      };
    }

    // Case when user unlinked provider the user but signIn google again
    if (user && !authProvider) {
      await runTransaction(async (prismaTransaction) => {
        // Update name user if not exist
        if (!user?.name) {
          await prismaTransaction.user.update({
            where: {
              id: user.id,
            },
            data: {
              name: userPayload.name,
            },
          });
        }
        // Update user status to activated
        await prismaTransaction.user.update({
          where: {
            id: user.id,
          },
          data: {
            status: USER_STATUS.ACTIVATED,
            latestLoginAt: new Date(),
          },
        });
        // Create user policy
        const policies = await prismaTransaction.policy.findMany();
        for (let i = 0; i < policies?.length; i += 1) {
          await prismaTransaction.userPolicy.upsert({
            where: { userId_policyId: { userId: user.id, policyId: policies[i].id } },
            update: { userId: user.id, policyId: policies[i].id },
            create: { userId: user.id, policyId: policies[i].id },
          });
        }
        // Create new authProvider
        await prismaTransaction.authProvider.create({
          data: {
            userId: user.id,
            authProvider: AUTH_PROVIDER_NAME.GOOGLE,
            providerUserId: userPayload.sub,
            providerEmail: userPayload.email,
          },
        });
      });
      // Send email login device
      await sendEmailWithTemplate({
        to: user.email,
        subject: EMAIL_SUBJECT.LoginDevice,
        templateId: SENDGRID_TEMPLATE_LOGIN_DEVICE_EMAIL,
        dynamicTemplateData: { device },
      });
      const accessToken = generateToken(
        { id: user.id, name: user.name } as PayloadAccessTokenType,
        JWT_SECRET,
        ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
      );
      return {
        status: HTTP_RESPONSE_CODE.OK,
        data: {
          user: {
            id: user.id,
            name: user.name,
            phoneNumber: user.phoneNumber,
            bio: user.bio,
            username: user.username,
            email: user.email,
            imageUrl: user.imageUrl,
            status: user.status,
            latestLoginAt: user.latestLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          } as UserType,
          accessToken,
          isFirstTimeLogin: false,
        },
      };
    }

    // Create new user and authProvider
    if (!user && !authProvider) {
      const result = await runTransaction(async (prismaTransaction) => {
        const newUser = await prismaTransaction.user.create({
          data: {
            name: userPayload.name,
            email: userPayload.email,
            status: USER_STATUS.ACTIVATED,
          },
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            bio: true,
            username: true,
            email: true,
            imageUrl: true,
            status: true,
            latestLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        await prismaTransaction.authProvider.create({
          data: {
            userId: newUser.id,
            authProvider: AUTH_PROVIDER_NAME.GOOGLE,
            providerUserId: userPayload.sub,
            providerEmail: userPayload.email,
          },
        });

        // Create user policy
        const policies = await prismaTransaction.policy.findMany();
        const createUserPolices = policies.map((policy) => ({
          userId: newUser.id,
          policyId: policy.id,
        }));
        await prismaTransaction.userPolicy.createMany({
          data: createUserPolices,
        });

        return newUser;
      });
      // Send email login device
      await sendEmailWithTemplate({
        to: result.email,
        subject: EMAIL_SUBJECT.LoginDevice,
        templateId: SENDGRID_TEMPLATE_LOGIN_DEVICE_EMAIL,
        dynamicTemplateData: { device },
      });
      const accessToken = generateToken(
        { id: result.id, name: result.name } as PayloadAccessTokenType,
        JWT_SECRET,
        ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
      );
      return {
        status: HTTP_RESPONSE_CODE.OK,
        data: { user: result as UserType, accessToken, isFirstTimeLogin: true },
      };
    }

    // Case user provider is not google or unknown
    return {
      status: HTTP_RESPONSE_CODE.UNAUTHORIZED,
      data: new AuthProviderMismatchError(),
    };
  } catch (error) {
    const err = error as Error;
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: new ResponseError(err.message),
    };
  }
};

export default {
  login,
};
