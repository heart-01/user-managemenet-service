import { v4 as uuidv4 } from 'uuid';
import { type SignOptions, verify } from 'jsonwebtoken';
import { EmailVerification } from '@prisma/client';
import loggerService from './logger.service';
import userActivityLogService from './userActivityLog.service';
import dayjs from '../config/dayjs';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  JWT_SECRET,
  SENDGRID_TEMPLATE_CHANGE_PASSWORD_EMAIL,
  SENDGRID_TEMPLATE_RESET_PASSWORD_EMAIL,
  SENDGRID_TEMPLATE_VERIFY_EMAIL,
  CLIENT_URL,
} from '../config/dotenv';
import { prisma, Prisma, runTransaction } from '../config/database';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';
import { USER_STATUS, EMAIL_VERIFICATION_ACTION_TYPE } from '../enums/prisma.enum';
import { UserAuthType, UserType } from '../types/users.type';
import { ResponseCommonType } from '../types/common.type';
import {
  generateUrlEmailVerifyRegister,
  generateUrlEmailVerifyResetPassword,
  sendEmailWithTemplate,
} from '../utils/email';
import {
  ConflictError,
  ForbiddenError,
  InvalidDataError,
  RecordNotFoundError,
  ResponseError,
} from '../errors';
import { generateToken } from '../utils/token';
import { hashPassword, verifyPassword } from '../utils/hashing';
import {
  AuthResponseType,
  AuthValidateResponseType,
  PayloadAccessTokenType,
  PayloadTokenVerifyEmailType,
  RegisterType,
  ResetPasswordBodyType,
  ResetPasswordResponseType,
  VerifyEmailResponseType,
} from '../types/auth.type';
import { EMAIL_SUBJECT } from '../enums/email.enum';

const authValidate = async (
  token: string,
): Promise<ResponseCommonType<AuthValidateResponseType | Error>> => {
  try {
    loggerService.info('authValidate');
    loggerService.debug('token', token);

    const decoded = verify(token, JWT_SECRET) as PayloadAccessTokenType;
    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: {
        user: decoded,
      },
    };
  } catch (error) {
    loggerService.error(error);
    const err = error as Error;
    return {
      status: HTTP_RESPONSE_CODE.UNAUTHORIZED,
      data: new ResponseError(err.message),
    };
  }
};

const login = async (
  email: string,
  password: string,
): Promise<ResponseCommonType<AuthResponseType | Error>> => {
  try {
    loggerService.info('localLogin');
    loggerService.debug('email', email);
    loggerService.debug('password', password);

    // Check recent login attempts
    const recentAttempts = await userActivityLogService.checkRecentLoginAttempts(email);
    if (recentAttempts.status !== HTTP_RESPONSE_CODE.OK) {
      return {
        status: HTTP_RESPONSE_CODE.FORBIDDEN,
        data: new ForbiddenError(
          `Too many login attempts. Please try again later ${recentAttempts.data}`,
        ),
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstname: true,
        lastname: true,
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
    });

    // Case user status is pending
    if (user && user.status === USER_STATUS.PENDING) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: new ConflictError('User not activated.'),
      };
    }

    // Case user login success
    if (user && user.status === USER_STATUS.ACTIVATED) {
      if (!user.password) {
        return {
          status: HTTP_RESPONSE_CODE.UNAUTHORIZED,
          data: new InvalidDataError('Invalid email or password. Please try again.'),
        };
      }

      // Verify password
      const isPasswordMatch = await verifyPassword(password, user.password);

      // Case password not match
      if (!isPasswordMatch) {
        return {
          status: HTTP_RESPONSE_CODE.UNAUTHORIZED,
          data: new InvalidDataError('Invalid email or password. Please try again.'),
        };
      }

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
        {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
        } as PayloadAccessTokenType,
        JWT_SECRET,
        ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
      );

      return {
        status: HTTP_RESPONSE_CODE.OK,
        data: {
          user: {
            id: user.id,
            bio: user.bio,
            username: user.username,
            password: Boolean(user.password),
            email: user.email,
            imageUrl: user.imageUrl,
            firstname: user.firstname,
            lastname: user.lastname,
            phoneNumber: user.phoneNumber,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt,
            latestLoginAt: user.latestLoginAt,
            AuthProvider: user.AuthProvider ? user.AuthProvider : [],
          } as UserAuthType,
          accessToken,
          isFirstTimeLogin: false,
        },
      };
    }

    // Case user login is mismatch
    return {
      status: HTTP_RESPONSE_CODE.UNAUTHORIZED,
      data: new RecordNotFoundError('Invalid email or password. Please try again.'),
    };
  } catch (error) {
    const err = error as Error;
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: new ResponseError(err.message),
    };
  }
};

const sendEmailRegister = async (
  email: string,
): Promise<ResponseCommonType<EmailVerification | Error>> => {
  try {
    loggerService.info('sendEmailRegister');
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
    const currentDate = dayjs();
    const expiredAt = currentDate.add(1, 'd').toDate();
    const tokenExpiresIn = Math.floor((expiredAt.getTime() - currentDate.valueOf()) / 1000); // Duration in seconds

    // Case user registered but not activated
    if (user && user.status === USER_STATUS.PENDING) {
      const emailVerification = await prisma.emailVerification.findFirst({
        where: {
          userId: user.id,
          type: EMAIL_VERIFICATION_ACTION_TYPE.REGISTER,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      const isEmailExpired =
        emailVerification && currentDate.isAfter(dayjs(emailVerification.expiredAt));
      const isTokenCompleted = emailVerification && emailVerification.completedAt;

      // Case email verification is expired or token is completed
      if (isEmailExpired || isTokenCompleted) {
        const token = uuidv4();
        const payload: PayloadTokenVerifyEmailType = {
          id: emailVerification.userId,
          token,
          email,
        };
        const accessToken = generateToken(payload, JWT_SECRET, tokenExpiresIn);
        const newEmailVerification = await prisma.emailVerification.create({
          data: {
            userId: emailVerification.userId,
            token,
            expiredAt,
            type: EMAIL_VERIFICATION_ACTION_TYPE.REGISTER,
          },
        });
        await sendEmailWithTemplate({
          to: email,
          subject: EMAIL_SUBJECT.Register,
          templateId: SENDGRID_TEMPLATE_VERIFY_EMAIL,
          dynamicTemplateData: {
            verificationLink: generateUrlEmailVerifyRegister(accessToken),
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
          email,
        };
        const accessToken = generateToken(payload, JWT_SECRET, tokenExpiresIn);
        await sendEmailWithTemplate({
          to: email,
          subject: EMAIL_SUBJECT.Register,
          templateId: SENDGRID_TEMPLATE_VERIFY_EMAIL,
          dynamicTemplateData: {
            verificationLink: generateUrlEmailVerifyRegister(accessToken),
          },
        });
        return {
          status: HTTP_RESPONSE_CODE.CREATED,
          data: emailVerification,
        };
      }
    }

    // Case user not registered before
    const newUser: UserType = await prisma.user.create({
      data: { email, status: USER_STATUS.PENDING },
    });
    const token = uuidv4();
    const payload: PayloadTokenVerifyEmailType = { id: newUser.id, token, email };
    const accessToken = generateToken(payload, JWT_SECRET, tokenExpiresIn);
    const newEmailVerification = await prisma.emailVerification.create({
      data: {
        userId: newUser.id,
        token,
        expiredAt,
        type: EMAIL_VERIFICATION_ACTION_TYPE.REGISTER,
      },
    });
    await sendEmailWithTemplate({
      to: email,
      subject: EMAIL_SUBJECT.Register,
      templateId: SENDGRID_TEMPLATE_VERIFY_EMAIL,
      dynamicTemplateData: {
        verificationLink: generateUrlEmailVerifyRegister(accessToken),
      },
    });
    return {
      status: HTTP_RESPONSE_CODE.CREATED,
      data: newEmailVerification,
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
  type: EMAIL_VERIFICATION_ACTION_TYPE,
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
      data: {
        token,
        userId: decoded.id,
        ...(decoded.email !== undefined && { email: decoded.email }),
      },
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

    // Check username forbidden
    const forbiddenUsername = await prisma.forbiddenUsername.findUnique({
      where: { username: user.username },
    });
    if (forbiddenUsername) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: new ConflictError('Username is forbidden'),
      };
    }

    // Prepare data fro update user and user policy
    const hashedPassword = await hashPassword(user.password);
    const userPolicyData: Prisma.UserPolicyCreateManyInput[] = user.userPolicy.map((policyId) => ({
      userId: user.userId,
      policyId,
    }));

    const result = await runTransaction(async (prismaTransaction) => {
      const userUpdated = await prismaTransaction.user.update({
        where: { id: user.userId },
        data: {
          firstname: user.firstname,
          lastname: user.lastname,
          username: user.username,
          password: hashedPassword,
          status: USER_STATUS.ACTIVATED,
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
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
        },
      });

      await prismaTransaction.userPolicy.createMany({
        data: userPolicyData,
      });

      return userUpdated;
    });

    const accessToken = generateToken(
      {
        id: result.id,
        firstname: result.firstname,
        lastname: result.lastname,
      } as PayloadAccessTokenType,
      JWT_SECRET,
      ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
    );

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: {
        user: {
          id: result.id,
          firstname: result.firstname,
          lastname: result.lastname,
          phoneNumber: result.phoneNumber,
          bio: result.bio,
          username: result.username,
          password: Boolean(result.password),
          email: result.email,
          imageUrl: result.imageUrl,
          status: result.status,
          latestLoginAt: result.latestLoginAt,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          AuthProvider: [],
        } as UserAuthType,
        accessToken,
        isFirstTimeLogin: true,
      },
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

const sendEmailResetPassword = async (
  email: string,
): Promise<ResponseCommonType<EmailVerification | Error>> => {
  try {
    loggerService.info('sendEmailResetPassword');
    loggerService.debug('email', email);

    // Check recent login attempts
    const recentAttempts = await userActivityLogService.checkRecentLoginAttempts(email);
    if (recentAttempts.status !== HTTP_RESPONSE_CODE.OK) {
      return {
        status: HTTP_RESPONSE_CODE.FORBIDDEN,
        data: new ForbiddenError(
          `Too many login attempts. Please try again later ${recentAttempts.data}`,
        ),
      };
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Case user status is pending
    if (user && user.status === USER_STATUS.PENDING) {
      return {
        status: HTTP_RESPONSE_CODE.CONFLICT,
        data: new ConflictError('User not activated'),
      };
    }

    // Config expiredAt for email verification
    const currentDate = dayjs();
    const expiredAt = currentDate.add(1, 'd').toDate();
    const tokenExpiresIn = Math.floor((expiredAt.getTime() - currentDate.valueOf()) / 1000); // Duration in seconds

    // Case user registered status is activated
    if (user && user.status === USER_STATUS.ACTIVATED) {
      const emailVerification = await prisma.emailVerification.findFirst({
        where: {
          userId: user.id,
          type: EMAIL_VERIFICATION_ACTION_TYPE.RESETPASSWORD,
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
            type: EMAIL_VERIFICATION_ACTION_TYPE.RESETPASSWORD,
          },
        });
        await sendEmailWithTemplate({
          to: email,
          subject: EMAIL_SUBJECT.ResetPassword,
          templateId: SENDGRID_TEMPLATE_RESET_PASSWORD_EMAIL,
          dynamicTemplateData: {
            verificationLink: generateUrlEmailVerifyResetPassword(accessToken),
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
            type: EMAIL_VERIFICATION_ACTION_TYPE.RESETPASSWORD,
          },
        });
        await sendEmailWithTemplate({
          to: email,
          subject: EMAIL_SUBJECT.ResetPassword,
          templateId: SENDGRID_TEMPLATE_RESET_PASSWORD_EMAIL,
          dynamicTemplateData: {
            verificationLink: generateUrlEmailVerifyResetPassword(accessToken),
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
          subject: EMAIL_SUBJECT.ResetPassword,
          templateId: SENDGRID_TEMPLATE_RESET_PASSWORD_EMAIL,
          dynamicTemplateData: {
            verificationLink: generateUrlEmailVerifyResetPassword(accessToken),
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
    const err = error as Error;
    return {
      status: HTTP_RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      data: new ResponseError(err.message),
    };
  }
};

const resetPassword = async (
  id: string,
  user: ResetPasswordBodyType,
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
    const result = await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
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

    await sendEmailWithTemplate({
      to: result.email,
      subject: EMAIL_SUBJECT.ChangePassword,
      templateId: SENDGRID_TEMPLATE_CHANGE_PASSWORD_EMAIL,
      dynamicTemplateData: {
        username: result.username,
        resetPasswordLink: `${CLIENT_URL}/forgot-password?email=${result.email}`,
      },
    });

    return {
      status: HTTP_RESPONSE_CODE.OK,
      data: { user: result as UserType },
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
  authValidate,
  login,
  sendEmailRegister,
  verifyEmail,
  register,
  sendEmailResetPassword,
  resetPassword,
};
