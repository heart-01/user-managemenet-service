import Joi from 'joi';
import { EMAIL_VERIFICATION_ACTION_TYPE } from '../enums/prisma.enum';
import {
  PASSWORD_PATTERN,
  PASSWORD_VALIDATE,
  USERNAME_PATTERN,
  USERNAME_VALIDATE,
} from '../enums/user.enum';

const authValidate: Joi.ObjectSchema = Joi.object().keys({
  token: Joi.string().required(),
});

const googleAuth: Joi.ObjectSchema = Joi.object().keys({
  idToken: Joi.string().required(),
});

const googleLinkAccountParam = Joi.object().keys({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const googleLinkAccountBody = Joi.object().keys({
  providerUserId: Joi.string().required(),
  providerEmail: Joi.string().email().required(),
});

const googleUnlinkAccountParam = Joi.object().keys({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const localAuth: Joi.ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const sendEmailRegister: Joi.ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required(),
});

const verifyEmail: Joi.ObjectSchema = Joi.object().keys({
  token: Joi.string().required(),
  type: Joi.string().valid(...Object.values(EMAIL_VERIFICATION_ACTION_TYPE)),
});

const userPayloadSchema = Joi.object({
  sub: Joi.string().required(),
  email: Joi.string().email().required(),
  given_name: Joi.string().required(),
  family_name: Joi.string().required(),
}).unknown(true);

const register: Joi.ObjectSchema = Joi.object().keys({
  userId: Joi.string().guid({ version: 'uuidv4' }).required(),
  password: Joi.string()
    .required()
    .min(PASSWORD_VALIDATE.MIN)
    .max(PASSWORD_VALIDATE.MAX)
    .pattern(PASSWORD_PATTERN),
  confirmPassword: Joi.string()
    .required()
    .min(PASSWORD_VALIDATE.MIN)
    .max(PASSWORD_VALIDATE.MAX)
    .pattern(PASSWORD_PATTERN),
  userPolicy: Joi.array()
    .items(Joi.string().guid({ version: 'uuidv4' }).required())
    .required(),
  firstname: Joi.string().max(30).required(),
  lastname: Joi.string().max(30).required(),
  username: Joi.string()
    .required()
    .min(USERNAME_VALIDATE.MIN)
    .max(USERNAME_VALIDATE.MAX)
    .pattern(USERNAME_PATTERN),
});

const sendEmailResetPassword: Joi.ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required(),
});

const resetPasswordParam: Joi.ObjectSchema = Joi.object().keys({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const resetPasswordBody: Joi.ObjectSchema = Joi.object().keys({
  password: Joi.string()
    .required()
    .min(PASSWORD_VALIDATE.MIN)
    .max(PASSWORD_VALIDATE.MAX)
    .pattern(PASSWORD_PATTERN),
  confirmPassword: Joi.string()
    .required()
    .min(PASSWORD_VALIDATE.MIN)
    .max(PASSWORD_VALIDATE.MAX)
    .pattern(PASSWORD_PATTERN),
});

const getAuthProvider: Joi.ObjectSchema = Joi.object().keys({
  userId: Joi.string().guid({ version: 'uuidv4' }).required(),
});

export default {
  authValidate,
  googleAuth,
  googleLinkAccountParam,
  googleLinkAccountBody,
  googleUnlinkAccountParam,
  localAuth,
  sendEmailRegister,
  verifyEmail,
  userPayloadSchema,
  register,
  sendEmailResetPassword,
  resetPasswordParam,
  resetPasswordBody,
  getAuthProvider,
};
