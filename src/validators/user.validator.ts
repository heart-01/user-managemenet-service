import Joi from 'joi';
import { EMAIL_VERIFICATION_ACTION_TYPE } from '../enums/prisma.enum';
import {
  PASSWORD_PATTERN,
  PASSWORD_VALIDATE,
  USERNAME_PATTERN,
  USERNAME_VALIDATE,
} from '../enums/user.enum';

const getUserById: Joi.ObjectSchema = Joi.object().keys({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const checkUsername: Joi.ObjectSchema = Joi.object().keys({
  userId: Joi.string().guid({ version: 'uuidv4' }).required(),
  username: Joi.string()
    .required()
    .min(USERNAME_VALIDATE.MIN)
    .max(USERNAME_VALIDATE.MAX)
    .pattern(USERNAME_PATTERN),
});

const updateUserParam: Joi.ObjectSchema = Joi.object().keys({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const updateUserBody: Joi.ObjectSchema = Joi.object().keys({
  bio: Joi.string().optional().allow(null, ''),
  name: Joi.string().max(70).optional().allow(null, ''),
  password: Joi.string()
    .optional()
    .min(PASSWORD_VALIDATE.MIN)
    .max(PASSWORD_VALIDATE.MAX)
    .pattern(PASSWORD_PATTERN),
  username: Joi.string()
    .optional()
    .min(USERNAME_VALIDATE.MIN)
    .max(USERNAME_VALIDATE.MAX)
    .pattern(USERNAME_PATTERN),
});

const deleteUser: Joi.ObjectSchema = Joi.object().keys({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const userDeletionFeedbackParam: Joi.ObjectSchema = Joi.object().keys({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const userDeletionFeedbackBody: Joi.ObjectSchema = Joi.object().keys({
  reason: Joi.string().trim().min(1).required(),
});

const sendEmailDeleteAccount: Joi.ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required(),
});

const verifyEmail: Joi.ObjectSchema = Joi.object().keys({
  token: Joi.string().required(),
  type: Joi.string().valid(...Object.values(EMAIL_VERIFICATION_ACTION_TYPE)),
});

const getUserDeviceSessionActive: Joi.ObjectSchema = Joi.object().keys({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const updateUserDeviceSessionActiveParam: Joi.ObjectSchema = Joi.object().keys({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const updateUserDeviceSessionActiveBody: Joi.ObjectSchema = Joi.object().keys({
  deviceId: Joi.string().guid({ version: 'uuidv4' }).required(),
});

export default {
  getUserById,
  checkUsername,
  updateUserParam,
  updateUserBody,
  deleteUser,
  userDeletionFeedbackParam,
  userDeletionFeedbackBody,
  sendEmailDeleteAccount,
  verifyEmail,
  getUserDeviceSessionActive,
  updateUserDeviceSessionActiveParam,
  updateUserDeviceSessionActiveBody,
};
