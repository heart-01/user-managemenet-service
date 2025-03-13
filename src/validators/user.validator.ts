import Joi from 'joi';

const getUserById: Joi.ObjectSchema = Joi.object().keys({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const checkUsername: Joi.ObjectSchema = Joi.object().keys({
  username: Joi.string()
    .required()
    .min(4)
    .max(30)
    .pattern(/^(?=.*[a-zA-Z])[a-zA-Z0-9_.]+$/),
});

const updateUser: Joi.ObjectSchema = Joi.object().keys({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
  bio: Joi.string().optional().allow(null, ''),
  name: Joi.string().max(50).optional().allow(null, ''),
  password: Joi.string()
    .optional()
    .min(8)
    .max(20)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
});

export default {
  getUserById,
  checkUsername,
  updateUser,
};
