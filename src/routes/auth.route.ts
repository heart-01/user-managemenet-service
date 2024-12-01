import express from 'express';
import authValidator from '../validators/auth.validator';
import { validateSchemaMiddleware, JOI_OPTIONS } from '../middlewares/validation';
import { authController } from '../controllers';
import { authenticateMiddleware } from '../middlewares/authentication';
import { authorizeMiddleware } from '../middlewares/authorize';
import { Actions } from '../enums/ability.enum';

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

/**
 * @typedef {object} verifyEmailRequest
 * @property {string} token.required - Token to verify
 */

/**
 * @typedef {object} verifyEmailSuccessResponse
 * @property {string} token - token
 * @property {string} userId - user id
 * @property {string} type - action type for the token
 * @property {string} createdAt - token creation timestamp
 * @property {string} expiredAt - token expiration timestamp
 * @property {string} completedAt - token completion timestamp
 */

/**
 * POST /auth/verify/email
 * @summary Verify Email
 * @security bearerAuth
 * @tags auth
 * @param {verifyEmailRequest} request.body.required - Token to verify
 * @return {verifyEmailSuccessResponse} 201 - Success response - application/json
 * @return {string} 500 - Internal Error - application/json
 */

/**
 * Register Complete Request
 * @typedef {object} RegisterCompleteRequest
 * @property {string} userId - User's ID
 * @property {string} password - User's password
 * @property {string} confirmPassword - User's password confirmation
 * @property {string} name - User's name
 * @property {string} username - User's username
 * @property {Array<string>} userPolicy - User's policy agreement
 */

/**
 * POST /auth/local/register/complete
 * @summary Complete Local Register
 * @security bearerAuth
 * @tags auth
 * @param {RegisterCompleteRequest} request.body.required - User update request
 * @return {AuthSuccessResponse} 200 - Success response - application/json
 * @return {string} 404 - User not found - application/json
 * @return {string} 400 - Bad request - application/json
 * @return {string} 401 - Unauthorized - application/json
 * @return {string} 403 - Forbidden - application/json
 * @return {string} 500 - Internal server error - application/json
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

authRouter.post(
  '/verify/email',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.verifyEmail,
  }),
  authController.verifyEmail,
);

authRouter.post(
  '/local/register/complete',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.registerComplete,
  }),
  authorizeMiddleware(Actions.Create, 'registerComplete'),
  authController.registerComplete,
);

export default authRouter;
