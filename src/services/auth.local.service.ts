import { v4 as uuidv4 } from 'uuid';
import { verify } from 'jsonwebtoken';
import { EmailVerification } from '@prisma/client';
import loggerService from './logger.service';
import dayjs from '../config/dayjs';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  CLIENT_URL,
  JWT_SECRET,
  SENDGRID_TEMPLATE_RESET_PASSWORD_EMAIL,
  SENDGRID_TEMPLATE_VERIFY_EMAIL,
} from '../config/dotenv';
import { prisma, Prisma, USER_STATUS, ACTION_TYPE, runTransaction } from '../config/database';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { UserType } from '../types/users.type';
import { ResponseCommonType } from '../types/common.type';
import { sendEmailWithTemplate } from '../utils/email';
import {
  ConflictError,
  InvalidDataError,
  VerifyEmailExistMismatchError,
  RecordNotFoundError,
  ResponseError,
  ResetPasswordMismatchError,
} from '../errors';
import { generateToken } from '../utils/token';
import { hashPassword } from '../utils/hashing';
import {
  AuthResponseType,
  PayloadTokenResetPasswordType,
  PayloadTokenVerifyEmailType,
  RegisterType,
  ResetPasswordResponseType,
  ResetPasswordType,
  VerifyEmailResponseType,
} from '../types/auth.type';

const verifyEmailExist = async (
  email: string,
): Promise<ResponseCommonType<EmailVerification | Error>> => {
  try {
    loggerService.info('verifyEmailExist');
    loggerService.debug('email', email);

    const user = await prisma.user.findUnique({ where: { email } });

    // Case user registered before
    if (user && user.status === USER_STATUS.ACTIVATED) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: new ConflictError('User already exists'),
      };
    }

    // Config expiredAt for email verification
    const expiredAt = dayjs().add(1, 'd').toDate();
    const tokenExpiresIn = Math.floor((expiredAt.getTime() - Date.now()) / 1000); // Duration in seconds

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
      const isTokenCompleted = emailVerification && emailVerification.completedAt;

      // Case email verification is expired or token is completed
      if (isEmailExpired || isTokenCompleted) {
        const token = uuidv4();
        const payload: PayloadTokenVerifyEmailType = { id: emailVerification.userId, token };
        const accessToken = generateToken(payload, JWT_SECRET, tokenExpiresIn);
        const newEmailVerification = await prisma.emailVerification.create({
          data: {
            userId: emailVerification.userId,
            token,
            expiredAt,
            type: ACTION_TYPE.REGISTER,
          },
        });
        await sendEmailWithTemplate({
          to: email,
          subject: 'Investnity - Verify your email address',
          templateId: SENDGRID_TEMPLATE_VERIFY_EMAIL,
          dynamicTemplateData: {
            verificationLink: `${CLIENT_URL}/api/auth/verify/email?token=${accessToken}`,
          },
        });
        return {
          status: HTTP_RESPONSE_CODE.CREATED,
          data: newEmailVerification,
        };
      }

      // Resend email verification
      if (!isTokenCompleted && !isEmailExpired && emailVerification) {
        const payload: PayloadTokenVerifyEmailType = {
          id: emailVerification.userId,
          token: emailVerification.token,
        };
        const accessToken = generateToken(payload, JWT_SECRET, tokenExpiresIn);
        await sendEmailWithTemplate({
          to: email,
          subject: 'Investnity - Verify your email address',
          templateId: SENDGRID_TEMPLATE_VERIFY_EMAIL,
          dynamicTemplateData: {
            verificationLink: `${CLIENT_URL}/api/auth/verify/email?token=${accessToken}`,
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
      const token = uuidv4();
      const payload: PayloadTokenVerifyEmailType = { id: newUser.id, token };
      const accessToken = generateToken(payload, JWT_SECRET, tokenExpiresIn);
      const newEmailVerification = await prisma.emailVerification.create({
        data: {
          userId: newUser.id,
          token,
          expiredAt,
          type: ACTION_TYPE.REGISTER,
        },
      });
      await sendEmailWithTemplate({
        to: email,
        subject: 'Investnity - Verify your email address',
        templateId: SENDGRID_TEMPLATE_VERIFY_EMAIL,
        dynamicTemplateData: {
          verificationLink: `${CLIENT_URL}/api/auth/verify/email?token=${accessToken}`,
        },
      });
      return {
        status: HTTP_RESPONSE_CODE.CREATED,
        data: newEmailVerification,
      };
    }

    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: new VerifyEmailExistMismatchError(),
    };
  } catch (error) {
    const err = error as Error;
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: new ResponseError(err.message),
    };
  }
};

const verifyEmail = async (
  token: string,
  type: ACTION_TYPE,
): Promise<ResponseCommonType<VerifyEmailResponseType | Error>> => {
  try {
    loggerService.info('verifyEmail');
    loggerService.debug('token', token);

    const decoded = verify(token, JWT_SECRET) as PayloadTokenVerifyEmailType;
    const emailVerification = await prisma.emailVerification.findFirst({
      where: { token: decoded.token, type, completedAt: null },
    });

    // Case token not found
    if (!emailVerification) {
      return {
        status: HTTP_RESPONSE_CODE.UNAUTHORIZED,
        data: new InvalidDataError('Invalid Token'),
      };
    }

    const isEmailExpired = emailVerification && dayjs().isAfter(dayjs(emailVerification.expiredAt));

    // Case email verification is expired
    if (isEmailExpired) {
      return {
        status: HTTP_RESPONSE_CODE.UNAUTHORIZED,
        data: new InvalidDataError('Token expired'),
      };
    }

    // Update completedAt for email verification
    await prisma.emailVerification.update({
      where: { token: decoded.token },
      data: { completedAt: new Date() },
    });

    return {
      status: HTTP_RESPONSE_CODE.CREATED,
      data: { token, userId: decoded.id },
    };
  } catch (error) {
    const err = error as Error;
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: new ResponseError(err.message),
    };
  }
};

const register = async (
  user: RegisterType,
): Promise<ResponseCommonType<AuthResponseType | Error>> => {
  try {
    loggerService.info('register');
    loggerService.debug('user', user);

    if (user.password !== user.confirmPassword) {
      return {
        status: HTTP_RESPONSE_CODE.BAD_REQUEST,
        data: new InvalidDataError('Password and Confirm Password do not match.'),
      };
    }

    // Check username already exists
    const usernameExist = await prisma.user.findUnique({ where: { username: user.username } });
    if (usernameExist) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: new ConflictError('Username already exists'),
      };
    }

    // Prepare data fro update user and user policy
    const hashedPassword = await hashPassword(user.password);
    const userPolicyData: Prisma.UserPolicyCreateManyInput[] = user.userPolicy.map((policyId) => ({
      userId: user.userId,
      policyId,
      agreedAt: new Date(),
    }));

    const result = await runTransaction(async (prismaTransaction) => {
      const userUpdated: UserType = await prismaTransaction.user.update({
        where: { id: user.userId },
        data: {
          name: user.name,
          username: user.username,
          password: hashedPassword,
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

      await prismaTransaction.userPolicy.createMany({
        data: userPolicyData,
      });

      return userUpdated;
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return {
          status: HTTP_RESPONSE_CODE.NOT_FOUND,
          data: new RecordNotFoundError('User not found'),
        };
      }
    }
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

const verifyEmailResetPassword = async (
  email: string,
): Promise<ResponseCommonType<EmailVerification | Error>> => {
  try {
    loggerService.info('verifyEmailResetPassword');
    loggerService.debug('email', email);

    const user = await prisma.user.findUnique({ where: { email } });

    // Case user not found
    if (!user) {
      return {
        status: HTTP_RESPONSE_CODE.NOT_FOUND,
        data: new RecordNotFoundError('User not found'),
      };
    }

    // Case user status is pending
    if (user && user.status === USER_STATUS.PENDING) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: new ConflictError('User not activated'),
      };
    }

    // Config expiredAt for email verification
    const expiredAt = dayjs().add(1, 'd').toDate();
    const tokenExpiresIn = Math.floor((expiredAt.getTime() - Date.now()) / 1000); // Duration in seconds

    // Case user registered status is activated
    if (user && user.status === USER_STATUS.ACTIVATED) {
      const emailVerification = await prisma.emailVerification.findFirst({
        where: {
          userId: user.id,
          type: ACTION_TYPE.RESETPASSWORD,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      const isEmailExpired =
        emailVerification && dayjs().isAfter(dayjs(emailVerification.expiredAt));
      const isTokenCompleted = emailVerification && emailVerification.completedAt;

      // Case email verification not found
      if (!emailVerification) {
        const token = uuidv4();
        const payload: PayloadTokenResetPasswordType = { id: user.id, token };
        const accessToken = generateToken(payload, JWT_SECRET, tokenExpiresIn);
        const newEmailVerification = await prisma.emailVerification.create({
          data: { userId: user.id, token, expiredAt, type: ACTION_TYPE.RESETPASSWORD },
        });
        await sendEmailWithTemplate({
          to: email,
          subject: 'Investnity - Reset your password',
          templateId: SENDGRID_TEMPLATE_RESET_PASSWORD_EMAIL,
          dynamicTemplateData: {
            verificationLink: `${CLIENT_URL}/api/auth/verify/reset-password?token=${accessToken}`,
          },
        });
        return {
          status: HTTP_RESPONSE_CODE.CREATED,
          data: newEmailVerification,
        };
      }

      // Case email verification is expired or token is completed
      if (isEmailExpired || isTokenCompleted) {
        const token = uuidv4();
        const payload: PayloadTokenResetPasswordType = { id: emailVerification.userId, token };
        const accessToken = generateToken(payload, JWT_SECRET, tokenExpiresIn);
        const newEmailVerification = await prisma.emailVerification.create({
          data: {
            userId: emailVerification.userId,
            token,
            expiredAt,
            type: ACTION_TYPE.RESETPASSWORD,
          },
        });
        await sendEmailWithTemplate({
          to: email,
          subject: 'Investnity - Reset your password',
          templateId: SENDGRID_TEMPLATE_RESET_PASSWORD_EMAIL,
          dynamicTemplateData: {
            verificationLink: `${CLIENT_URL}/api/auth/verify/reset-password?token=${accessToken}`,
          },
        });
        return {
          status: HTTP_RESPONSE_CODE.CREATED,
          data: newEmailVerification,
        };
      }

      // Resend email verification
      if (!isTokenCompleted && !isEmailExpired && emailVerification) {
        const payload: PayloadTokenResetPasswordType = {
          id: emailVerification.userId,
          token: emailVerification.token,
        };
        const accessToken = generateToken(payload, JWT_SECRET, tokenExpiresIn);
        await sendEmailWithTemplate({
          to: email,
          subject: 'Investnity - Reset your password',
          templateId: SENDGRID_TEMPLATE_RESET_PASSWORD_EMAIL,
          dynamicTemplateData: {
            verificationLink: `${CLIENT_URL}/api/auth/verify/reset-password?token=${accessToken}`,
          },
        });
        return {
          status: HTTP_RESPONSE_CODE.CREATED,
          data: emailVerification,
        };
      }
    }

    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: new ResetPasswordMismatchError(),
    };
  } catch (error) {
    const err = error as Error;
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: new ResponseError(err.message),
    };
  }
};

const resetPassword = async (
  user: ResetPasswordType,
): Promise<ResponseCommonType<ResetPasswordResponseType | Error>> => {
  try {
    loggerService.info('resetPassword');
    loggerService.debug('user', user);

    if (user.password !== user.confirmPassword) {
      return {
        status: HTTP_RESPONSE_CODE.BAD_REQUEST,
        data: new InvalidDataError('Password and Confirm Password do not match.'),
      };
    }

    const hashedPassword = await hashPassword(user.password);
    const result: UserType = await prisma.user.update({
      where: { id: user.userId },
      data: {
        password: hashedPassword,
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

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: { user: result },
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return {
          status: HTTP_RESPONSE_CODE.NOT_FOUND,
          data: new RecordNotFoundError('User not found'),
        };
      }
    }
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export default {
  verifyEmailExist,
  verifyEmail,
  register,
  verifyEmailResetPassword,
  resetPassword,
};
