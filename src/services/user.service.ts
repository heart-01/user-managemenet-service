import { v4 as uuidv4 } from 'uuid';
import { EmailVerification, UserDeletionFeedback } from '@prisma/client';
import { prisma } from '../config/database';
import dayjs from '../config/dayjs';
import {
  JWT_SECRET,
  SENDGRID_TEMPLATE_DELETE_ACCOUNT_EMAIL,
  SENDGRID_TEMPLATE_DELETE_ACCOUNT_SUCCESS_EMAIL,
  SENDGRID_TEMPLATE_RESTORE_ACCOUNT_SUCCESS_EMAIL,
} from '../config/dotenv';
import { USER_STATUS, EMAIL_VERIFICATION_ACTION_TYPE } from '../enums/prisma.enum';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { EMAIL_SUBJECT } from '../enums/email.enum';
import { ConflictError, RecordNotFoundError } from '../errors';
import loggerService from './logger.service';
import { hashPassword, verifyPassword } from '../utils/hashing';
import { generateToken } from '../utils/token';
import {
  generateUrlEmailVerifyDeleteAccount,
  generateUrlRedirectHome,
  sendEmailWithTemplate,
} from '../utils/email';
import type { ResponseCommonType } from '../types/common.type';
import type { UpdateUserBodyType, UserType } from '../types/users.type';
import { PayloadTokenVerifyEmailType } from '../types/auth.type';

export const getUserById = async (id: string): Promise<ResponseCommonType<UserType | Error>> => {
  try {
    loggerService.info('getUserById');
    loggerService.debug('userId', id);

    const result = await prisma.user.findUnique({
      where: { id },
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

    if (!result) {
      return {
        status: HTTP_RESPONSE_CODE.NOT_FOUND,
        data: new RecordNotFoundError('User not found'),
      };
    }

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result as UserType,
    };
  } catch (error) {
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export const checkUsername = async (
  username: string,
): Promise<ResponseCommonType<boolean | Error>> => {
  try {
    loggerService.info('checkUsername');
    loggerService.debug('username', username);

    const result = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
      },
    });

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: Boolean(result),
    };
  } catch (error) {
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export const updateUser = async (
  id: string,
  data: UpdateUserBodyType,
): Promise<ResponseCommonType<UserType | Error>> => {
  try {
    const { username, password } = data;

    // Validate user exist
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return {
        status: HTTP_RESPONSE_CODE.NOT_FOUND,
        data: new RecordNotFoundError('User not found'),
      };
    }

    // Validate username
    if (username && username === user.username) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: new ConflictError('Username already exists'),
      };
    }

    // Validate password
    const isPasswordMatch =
      password && user.password ? await verifyPassword(password, user.password) : false;
    if (isPasswordMatch) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: new ConflictError('Duplicate password.'),
      };
    }

    // Update user
    const hashedPassword = password ? await hashPassword(password) : null;
    const result = await prisma.user.update({
      where: {
        id,
      },
      data: {
        ...data,
        ...(hashedPassword && {
          password: hashedPassword,
        }),
        updatedAt: dayjs().toDate(),
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

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result as UserType,
    };
  } catch (error) {
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export const deleteUser = async (id: string): Promise<ResponseCommonType<UserType | Error>> => {
  try {
    loggerService.info('deleteUser');
    loggerService.debug('userId', id);

    // Validate user exist
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return {
        status: HTTP_RESPONSE_CODE.NOT_FOUND,
        data: new RecordNotFoundError('User not found'),
      };
    }

    const result = await prisma.user.update({
      where: { id },
      data: { deletedAt: dayjs().toDate() },
    });

    await sendEmailWithTemplate({
      to: user.email,
      subject: EMAIL_SUBJECT.DeleteAccountSuccess,
      templateId: SENDGRID_TEMPLATE_DELETE_ACCOUNT_SUCCESS_EMAIL,
    });

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result as UserType,
    };
  } catch (error) {
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export const userDeletionFeedback = async (
  id: string,
  reason: string,
): Promise<ResponseCommonType<UserDeletionFeedback | Error>> => {
  try {
    loggerService.info('userDeletionFeedback');
    loggerService.debug('userId', id);
    loggerService.debug('reason', reason);

    // Validate user exist
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return {
        status: HTTP_RESPONSE_CODE.NOT_FOUND,
        data: new RecordNotFoundError('User not found'),
      };
    }

    const result: UserDeletionFeedback = await prisma.userDeletionFeedback.create({
      data: {
        userId: id,
        reason,
      },
    });

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result,
    };
  } catch (error) {
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

const sendEmailDeleteAccount = async (
  email: string,
): Promise<ResponseCommonType<EmailVerification | Error>> => {
  try {
    loggerService.info('sendEmailDeleteAccount');
    loggerService.debug('email', email);

    const user = await prisma.user.findUnique({ where: { email } });

    // Config expiredAt for email verification
    const currentDate = dayjs();
    const expiredAt = currentDate.add(1, 'd').toDate();
    const tokenExpiresIn = Math.floor((expiredAt.getTime() - currentDate.valueOf()) / 1000); // Duration in seconds

    if (user && user.status === USER_STATUS.ACTIVATED) {
      const emailVerification = await prisma.emailVerification.findFirst({
        where: {
          userId: user.id,
          type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      const isEmailExpired =
        emailVerification && currentDate.isAfter(dayjs(emailVerification.expiredAt));
      const isTokenCompleted = emailVerification && emailVerification.completedAt;

      // Case email verification not found
      if (!emailVerification) {
        const token = uuidv4();
        const payload: PayloadTokenVerifyEmailType = { id: user.id, token };
        const accessToken = generateToken(payload, JWT_SECRET, tokenExpiresIn);
        const newEmailVerification = await prisma.emailVerification.create({
          data: {
            userId: user.id,
            token,
            expiredAt,
            type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
          },
        });
        await sendEmailWithTemplate({
          to: email,
          subject: EMAIL_SUBJECT.DeleteAccount,
          templateId: SENDGRID_TEMPLATE_DELETE_ACCOUNT_EMAIL,
          dynamicTemplateData: {
            verificationLink: generateUrlEmailVerifyDeleteAccount(accessToken),
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
        const payload: PayloadTokenVerifyEmailType = { id: emailVerification.userId, token };
        const accessToken = generateToken(payload, JWT_SECRET, tokenExpiresIn);
        const newEmailVerification = await prisma.emailVerification.create({
          data: {
            userId: emailVerification.userId,
            token,
            expiredAt,
            type: EMAIL_VERIFICATION_ACTION_TYPE.DELETEACCOUNT,
          },
        });
        await sendEmailWithTemplate({
          to: email,
          subject: EMAIL_SUBJECT.DeleteAccount,
          templateId: SENDGRID_TEMPLATE_DELETE_ACCOUNT_EMAIL,
          dynamicTemplateData: {
            verificationLink: generateUrlEmailVerifyDeleteAccount(accessToken),
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
          subject: EMAIL_SUBJECT.DeleteAccount,
          templateId: SENDGRID_TEMPLATE_DELETE_ACCOUNT_EMAIL,
          dynamicTemplateData: {
            verificationLink: generateUrlEmailVerifyDeleteAccount(accessToken),
          },
        });
        return {
          status: HTTP_RESPONSE_CODE.CREATED,
          data: emailVerification,
        };
      }
    }

    // Case user not found
    return {
      status: HTTP_RESPONSE_CODE.NOT_FOUND,
      data: new RecordNotFoundError('User not found'),
    };
  } catch (error) {
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export const recoverUser = async (
  userId: string,
): Promise<ResponseCommonType<UserType | Error>> => {
  try {
    // Validate user exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return {
        status: HTTP_RESPONSE_CODE.NOT_FOUND,
        data: new RecordNotFoundError('User not found'),
      };
    }

    const result = await prisma.user.update({ where: { id: userId }, data: { deletedAt: null } });

    await sendEmailWithTemplate({
      to: user.email,
      subject: EMAIL_SUBJECT.RestoreAccountSuccess,
      templateId: SENDGRID_TEMPLATE_RESTORE_ACCOUNT_SUCCESS_EMAIL,
      dynamicTemplateData: {
        redirectLink: generateUrlRedirectHome(),
      },
    });

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: result as UserType,
    };
  } catch (error) {
    loggerService.error(error);
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: error as Error,
    };
  }
};

export default {
  getUserById,
  checkUsername,
  updateUser,
  deleteUser,
  userDeletionFeedback,
  sendEmailDeleteAccount,
  recoverUser,
};
