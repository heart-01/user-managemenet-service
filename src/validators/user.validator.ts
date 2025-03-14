import Joi from 'joi';
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
  name: Joi.string().max(50).optional().allow(null, ''),
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

export default {
  getUserById,
  checkUsername,
  updateUserParam,
  updateUserBody,
};
