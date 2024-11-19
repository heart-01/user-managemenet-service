import { EmailVerification } from '@prisma/client';
import loggerService from './logger.service';
import dayjs from '../config/dayjs';
import { JWT_SECRET, SENDGRID_TEMPLATE_VERIFY_EMAIL } from '../config/dotenv';
import { prisma, USER_STATUS, ACTION_TYPE } from '../config/database';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { UserType } from '../types/users.type';
import { ResponseCommonType } from '../types/common.type';
import { generateToken } from '../utils/token';
import { sendEmailWithTemplate } from '../utils/email';
import { ConflictError, LocalRegisterMismatchException, ResponseError } from '../errors';

const register = async (
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
  register,
};
