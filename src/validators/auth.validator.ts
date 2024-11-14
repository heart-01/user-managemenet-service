import Joi from 'joi';

const googleAuth: Joi.ObjectSchema = Joi.object().keys({
  idToken: Joi.string().required(),
});

const userPayloadSchema = Joi.object({
  sub: Joi.string().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
}).unknown(true);

export default {
  googleAuth,
  userPayloadSchema,
};