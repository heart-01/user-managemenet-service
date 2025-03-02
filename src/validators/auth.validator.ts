import Joi from 'joi';
import { EMAIL_VERIFICATION_ACTION_TYPE } from '../enums/prisma.enum';

const authValidate: Joi.ObjectSchema = Joi.object().keys({
  token: Joi.string().required(),
});

const googleAuth: Joi.ObjectSchema = Joi.object().keys({
  idToken: Joi.string().required(),
});

const localAuth: Joi.ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string()
    .required()
    .min(8)
    .max(20)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
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
  name: Joi.string().required(),
}).unknown(true);

const register: Joi.ObjectSchema = Joi.object().keys({
  userId: Joi.string().guid({ version: 'uuidv4' }).required(),
  password: Joi.string()
    .required()
    .min(8)
    .max(20)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
  confirmPassword: Joi.string()
    .required()
    .min(8)
    .max(20)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
  userPolicy: Joi.array()
    .items(Joi.string().guid({ version: 'uuidv4' }).required())
    .required(),
  name: Joi.string().required(),
  username: Joi.string()
    .required()
    .min(4)
    .max(30)
    .pattern(/^(?=.*[a-zA-Z])[a-zA-Z0-9_.]+$/),
});

const sendEmailResetPassword: Joi.ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required(),
});

const resetPassword: Joi.ObjectSchema = Joi.object().keys({
  userId: Joi.string().guid({ version: 'uuidv4' }).required(),
  password: Joi.string()
    .required()
    .min(8)
    .max(20)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
  confirmPassword: Joi.string()
    .required()
    .min(8)
    .max(20)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
});

export default {
  authValidate,
  googleAuth,
  localAuth,
  sendEmailRegister,
  verifyEmail,
  userPayloadSchema,
  register,
  sendEmailResetPassword,
  resetPassword,
};
