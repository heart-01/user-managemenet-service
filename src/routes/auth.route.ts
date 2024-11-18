import express from 'express';
import authValidator from '../validators/auth.validator';
import { validateSchemaMiddleware, JOI_OPTIONS } from '../middlewares/validation';
import { authController } from '../controllers';

const authRouter: express.Router = express.Router();

/**
 * @typedef {object} User
 * @property {string} id - User ID
 * @property {string} name - User's name
 * @property {string} phoneNumber - User's phone number
 * @property {string} bio - User's biography
 * @property {string} username - User's username
 * @property {string} email - User's email address
 * @property {string} imageUrl - URL to user's profile image
 * @property {string} status - User's status
 * @property {string} createdAt - Account creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */

/**
 * @typedef {object} AuthSuccessResponse
 * @property {User} user - User data
 * @property {string} accessToken - JWT access token
 * @property {boolean} isFirstTimeLogin - Indicates if this is the user's first login
 */

/**
 * @typedef {object} GoogleAuthRequest
 * @property {string} idToken.required - Google Auth idToken
 */

/**
 * POST /auth/google/login
 * @summary Google Auth
 * @tags auth
 * @param {GoogleAuthRequest} request.body.required - Google Auth idToken
 * @return {AuthSuccessResponse} 200 - Success response - application/json
 * @return {string} 401 - Unauthorized - application/json
 * @return {string} 409 - Conflict Error - application/json
 */

/**
 * @typedef {object} RegisterRequest
 * @property {string} email.required - User's email address
 */

/**
 * @typedef {object} RegisterSuccessResponse
 * @property {string} token - token
 * @property {string} userId - user id
 * @property {string} type - action type for the token
 * @property {string} createdAt - token creation timestamp
 * @property {string} expiredAt - token expiration timestamp
 * @property {string} completedAt - token completion timestamp
 */

/**
 * POST /auth/local/register
 * @summary Local Register
 * @tags auth
 * @param {RegisterRequest} request.body.required - User's email address
 * @return {RegisterSuccessResponse} 201 - Success response - application/json
 * @return {string} 500 - Internal Error - application/json
 */

authRouter.post(
  '/google/login',
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.googleAuth,
  }),
  authController.googleAuth,
);

authRouter.post(
  '/local/register',
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.localRegister,
  }),
  authController.localRegister,
);

export default authRouter;
