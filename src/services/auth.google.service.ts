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
import { UserType } from '../types/users.type';
import { ResponseCommonType } from '../types/common.type';
import { AuthResponseType } from '../types/auth.type';
import { generateToken } from '../utils/token';
import {
  AuthProviderMismatchError,
  ConflictError,
  GoogleIdTokenMissingScopeError,
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

    // Get user and authProvider
    const user: UserType | null = await prisma.user.findUnique({
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
      },
    });
    const authProvider: AuthProvider | null = await prisma.authProvider.findUnique({
      where: {
        providerUserId: userPayload.sub,
        authProvider: AUTH_PROVIDER_NAME.GOOGLE,
      },
    });

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
        { id: user.id, name: user.name },
        JWT_SECRET,
        ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
      );
      return {
        status: HTTP_RESPONSE_CODE.OK,
        data: { user, accessToken, isFirstTimeLogin: false },
      };
    }

    // Case when user unlinked provider the user but signIn google again
    if (user && !authProvider) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: new ConflictError('User already exists'),
      };
    }

    // Create new user and authProvider
    if (!user && !authProvider) {
      const result = await runTransaction(async (prismaTransaction) => {
        const newUser: UserType = await prismaTransaction.user.create({
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
      const accessToken = generateToken(
        { id: result.id, name: result.name },
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

export default {
  login,
};
