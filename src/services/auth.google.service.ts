import { LoginTicket, TokenPayload } from 'google-auth-library';
import { AuthProvider } from '@prisma/client';
import type { SignOptions } from 'jsonwebtoken';
import loggerService from './logger.service';
import authValidator from '../validators/auth.validator';
import { googleClient } from '../config/googleAuth';
import { ACCESS_TOKEN_EXPIRES_IN, GOOGLE_CLIENT_ID, JWT_SECRET } from '../config/dotenv';
import { prisma, runTransaction } from '../config/database';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { USER_STATUS, AUTH_PROVIDER_NAME } from '../enums/prisma.enum';
import { UserAuthType } from '../types/users.type';
import { ResponseCommonType } from '../types/common.type';
import { AuthResponseType, PayloadAccessTokenType } from '../types/auth.type';
import { generateToken } from '../utils/token';
import {
  AuthProviderMismatchError,
  GoogleIdTokenMissingScopeError,
  RecordNotFoundError,
  ResponseError,
} from '../errors';

const login = async (idToken: string): Promise<ResponseCommonType<AuthResponseType | Error>> => {
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
    userPayload.name = userPayload.name.replace(/[^A-Za-z\u0E00-\u0E7F ]/g, '').substring(0, 30);

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
        password: true,
        email: true,
        imageUrl: true,
        status: true,
        latestLoginAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
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
          password: true,
          email: true,
          imageUrl: true,
          status: true,
          latestLoginAt: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
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
            password: Boolean(user.password),
            email: user.email,
            imageUrl: user.imageUrl,
            status: user.status,
            latestLoginAt: user.latestLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt,
            AuthProvider: authProvider ? [authProvider] : [],
          } as UserAuthType,
          accessToken,
          isFirstTimeLogin: false,
        },
      };
    }

    // Case when user unlinked provider the user but signIn google again
    if (user && !authProvider) {
      const newAuthProvider = await runTransaction(async (prismaTransaction) => {
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
        const newAuthProvider = await prismaTransaction.authProvider.create({
          data: {
            userId: user.id,
            authProvider: AUTH_PROVIDER_NAME.GOOGLE,
            providerUserId: userPayload.sub,
            providerEmail: userPayload.email,
          },
        });

        return newAuthProvider;
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
            password: Boolean(user.password),
            email: user.email,
            imageUrl: user.imageUrl,
            status: user.status,
            latestLoginAt: user.latestLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt,
            AuthProvider: [newAuthProvider],
          } as UserAuthType,
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
            password: true,
            email: true,
            imageUrl: true,
            status: true,
            latestLoginAt: true,
            createdAt: true,
            deletedAt: true,
            updatedAt: true,
          },
        });
        const newAuthProvider = await prismaTransaction.authProvider.create({
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

        return {
          id: newUser.id,
          name: newUser.name,
          phoneNumber: newUser.phoneNumber,
          bio: newUser.bio,
          username: newUser.username,
          password: Boolean(newUser.password),
          email: newUser.email,
          imageUrl: newUser.imageUrl,
          status: newUser.status,
          latestLoginAt: newUser.latestLoginAt,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
          deletedAt: newUser.deletedAt,
          AuthProvider: [newAuthProvider],
        } as UserAuthType;
      });
      const accessToken = generateToken(
        { id: result.id, name: result.name } as PayloadAccessTokenType,
        JWT_SECRET,
        ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
      );
      return {
        status: HTTP_RESPONSE_CODE.OK,
        data: { user: result, accessToken, isFirstTimeLogin: true },
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

const linkAccount = async (authProvider: {
  userId: string;
  providerUserId: string;
  providerEmail: string;
}): Promise<ResponseCommonType<AuthProvider | Error>> => {
  try {
    loggerService.info('linkAccount');
    loggerService.debug('authProvider', authProvider);

    // Validate providerUserId
    const findAuthProvider = await prisma.authProvider.findFirst({
      where: {
        providerUserId: authProvider.providerUserId,
        authProvider: AUTH_PROVIDER_NAME.GOOGLE,
      },
    });

    // Check provider id already exist
    if (findAuthProvider) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: findAuthProvider,
      };
    }

    // Get authProvider from user
    const userAuthProvider = await prisma.authProvider.findFirst({
      where: { userId: authProvider.userId, authProvider: AUTH_PROVIDER_NAME.GOOGLE },
    });

    // Check if user already linked google account
    if (userAuthProvider) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: userAuthProvider,
      };
    }

    // Create new authProvider
    const newAuthProvider = await prisma.authProvider.create({
      data: {
        userId: authProvider.userId,
        authProvider: AUTH_PROVIDER_NAME.GOOGLE,
        providerUserId: authProvider.providerUserId,
        providerEmail: authProvider.providerEmail,
      },
    });

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: newAuthProvider,
    };
  } catch (error) {
    const err = error as Error;
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: new ResponseError(err.message),
    };
  }
};

const unlinkAccount = async (userId: string): Promise<ResponseCommonType<AuthProvider | Error>> => {
  try {
    loggerService.info('unlinkAccount');
    loggerService.debug('userId', userId);

    // Get authProvider from user
    const userAuthProvider = await prisma.authProvider.findFirst({
      where: { userId, authProvider: AUTH_PROVIDER_NAME.GOOGLE },
    });

    if (!userAuthProvider) {
      return {
        status: HTTP_RESPONSE_CODE.NOT_FOUND,
        data: new RecordNotFoundError('authProvider not found'),
      };
    }

    // Delete user authProvider
    const deleteAuthProvider = await prisma.authProvider.delete({
      where: { id: userAuthProvider.id },
    });

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: deleteAuthProvider,
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
  linkAccount,
  unlinkAccount,
};
