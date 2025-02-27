import Joi, { ValidationError } from 'joi';
import type { Request, NextFunction, Response } from 'express';
import { HTTP_RESPONSE_CODE } from '../enums/response.enum';

type JoiOptionsDataType = 'body' | 'params' | 'query';
type JoiOptionsType = {
  [key in JoiOptionsDataType]: JoiOptionsDataType;
};

export const JOI_OPTIONS: JoiOptionsType = {
  body: 'body',
  params: 'params',
  query: 'query',
};

export type ValidationType = {
  options: JoiOptionsDataType;
  schema: Joi.ObjectSchema;
};

export const validateSchemaMiddleware =
  (validation: ValidationType) =>
  (request: Request, response: Response, next: NextFunction): void => {
    try {
      const result = Joi.attempt(request[validation.options], validation.schema);
      request[validation.options] = result;
      return next();
    } catch (error) {
      if (error instanceof ValidationError) {
        response.status(HTTP_RESPONSE_CODE.BAD_REQUEST).json({
          message: error.details[0].message,
          context: error.details[0].context,
          path: error.details[0].path,
        });
        return next(error);
      }
      response.status(HTTP_RESPONSE_CODE.BAD_REQUEST).send('Invalid request params');
      return next(error);
    }
  };
