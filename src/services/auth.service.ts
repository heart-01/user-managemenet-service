import { LoginTicket, TokenPayload } from 'google-auth-library';
import { AuthProvider, EmailVerification } from '@prisma/client';
import loggerService from './logger.service';
import authValidator from '../validators/auth.validator';
import dayjs from '../config/dayjs';
import { googleClient } from '../config/googleAuth';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  GOOGLE_CLIENT_ID,
  JWT_SECRET,
  SENDGRID_TEMPLATE_VERIFY_EMAIL,
} from '../config/dotenv';
import {
  prisma,
  AUTH_PROVIDER_NAME,
  USER_STATUS,
  ACTION_TYPE,
  runTransaction,
} from '../config/database';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { UserType } from '../types/users.type';
import { ResponseCommonType } from '../types/common.type';
import { AuthResponseType } from '../types/auth.type';
import { generateToken } from '../utils/token';
import { sendEmailWithTemplate } from '../utils/email';
import {
  AuthProviderMismatchException,
  ConflictError,
  GoogleIdTokenMissingScopeError,
  LocalRegisterMismatchException,
  ResponseError,
} from '../errors';

const googleAuth = async (
  idToken: string,
): Promise<ResponseCommonType<AuthResponseType | Error>> => {
  try {
    loggerService.info('googleAuthVerifyToken');
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
      const accessToken = generateToken(
        { id: user.id, name: user.name },
        JWT_SECRET,
        ACCESS_TOKEN_EXPIRES_IN,
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
          agreedAt: new Date(),
        }));
        await prismaTransaction.userPolicy.createMany({
          data: createUserPolices,
        });

        return newUser;
      });
      const accessToken = generateToken(
        { id: result.id, name: result.name },
        JWT_SECRET,
        ACCESS_TOKEN_EXPIRES_IN,
      );
      return {
        status: HTTP_RESPONSE_CODE.OK,
        data: { user: result, accessToken, isFirstTimeLogin: true },
      };
    }

    // Case user provider is not google or unknown
    return {
      status: HTTP_RESPONSE_CODE.UNAUTHORIZED,
      data: new AuthProviderMismatchException(),
    };
  } catch (error) {
    const err = error as Error;
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: new ResponseError(err.message),
    };
  }
};

const localRegister = async (
  email: string,
): Promise<ResponseCommonType<EmailVerification | Error>> => {
  try {
    loggerService.info('localRegister');
    loggerService.debug('email', email);

    const user = await prisma.user.findUnique({ where: { email } });

    // Case user registered before
    if (user && user.status === USER_STATUS.ACTIVATED) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: new ConflictError('User already exists'),
      };
    }

    // Config expiredAt and expiresIn for email verification
    const expiredAt = dayjs().add(1, 'd').toDate();
    const expiresIn = Math.floor((expiredAt.getTime() - Date.now()) / 1000); // Convert expiredAt to seconds

    // Case user registered but not activated
    if (user && user.status === USER_STATUS.PENDING) {
      const emailVerification = await prisma.emailVerification.findFirst({
        where: {
          userId: user.id,
          type: ACTION_TYPE.REGISTER,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      const isEmailExpired =
        emailVerification && dayjs().isAfter(dayjs(emailVerification.expiredAt));

      // Case email verification is expired
      if (isEmailExpired) {
        const newToken = generateToken({ id: emailVerification.userId }, JWT_SECRET, expiresIn);
        const newEmailVerification = await prisma.emailVerification.create({
          data: {
            userId: emailVerification.userId,
            token: newToken,
            expiredAt,
            type: ACTION_TYPE.REGISTER,
          },
        });
        await sendEmailWithTemplate({
          to: email,
          subject: 'Investnity - Verify your email address',
          templateId: SENDGRID_TEMPLATE_VERIFY_EMAIL,
          dynamicTemplateData: {
            verificationLink: 'https://www.google.com', // link to verify email with token
          },
        });
        return {
          status: HTTP_RESPONSE_CODE.CREATED,
          data: newEmailVerification,
        };
      }

      // Resend email verification
      if (emailVerification) {
        await sendEmailWithTemplate({
          to: email,
          subject: 'Investnity - Verify your email address',
          templateId: SENDGRID_TEMPLATE_VERIFY_EMAIL,
          dynamicTemplateData: {
            verificationLink: 'https://www.google.com', // link to verify email with token
          },
        });

        return {
          status: HTTP_RESPONSE_CODE.CREATED,
          data: emailVerification,
        };
      }
    }

    // Case user not registered before
    if (!user) {
      const newUser: UserType = await prisma.user.create({
        data: { email, status: USER_STATUS.PENDING },
      });
      const newToken = generateToken({ id: newUser.id }, JWT_SECRET, expiresIn);
      const newEmailVerification = await prisma.emailVerification.create({
        data: {
          userId: newUser.id,
          token: newToken,
          expiredAt,
          type: ACTION_TYPE.REGISTER,
        },
      });
      await sendEmailWithTemplate({
        to: email,
        subject: 'Investnity - Verify your email address',
        templateId: SENDGRID_TEMPLATE_VERIFY_EMAIL,
        dynamicTemplateData: {
          verificationLink: 'https://www.google.com', // link to verify email with token
        },
      });
      return {
        status: HTTP_RESPONSE_CODE.CREATED,
        data: newEmailVerification,
      };
    }

    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: new LocalRegisterMismatchException(),
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
  googleAuth,
  localRegister,
};
