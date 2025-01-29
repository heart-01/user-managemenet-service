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

export default {
  getUserById,
  checkUsername,
};
