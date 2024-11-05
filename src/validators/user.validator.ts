import Joi from 'joi';

const getUserById: Joi.ObjectSchema = Joi.object().keys({
  id: Joi.string().guid({ version: 'uuidv4' }),
});

export default {
  getUserById,
};
