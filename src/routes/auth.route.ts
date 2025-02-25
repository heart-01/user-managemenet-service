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
 * @property {string} latestLoginAt - Last login timestamp
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
 * @typedef {object} EmailVerificationResponse
 * @property {string} token - token
 * @property {string} userId - user id
 * @property {string} type - action type for the token
 * @property {string} createdAt - token creation timestamp
 * @property {string} expiredAt - token expiration timestamp
 * @property {string} completedAt - token completion timestamp
 */

/**
 * @typedef {object} AuthValidateRequest
 * @property {string} token.required - JWT Token
 */

/**
 * POST /auth/validate
 * @summary Auth Validate JWT Token
 * @tags auth
 * @param {AuthValidateRequest} request.body.required - JWT Token
 * @return {AuthSuccessResponse} 200 - Success response - application/json
 * @return {string} 401 - Unauthorized - application/json
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
 */

/**
 * @typedef {object} LocalAuthRequest
 * @property {string} email.required - User's email address
 * @property {string} password.required - User's password
 */

/**
 * POST /auth/local/login
 * @summary Local Auth
 * @tags auth
 * @param {LocalAuthRequest} request.body.required - User's email and password
 * @return {AuthSuccessResponse} 200 - Success response - application/json
 * @return {string} 401 - Unauthorized - application/json
 * @return {string} 409 - Conflict Error - application/json
 */

/**
 * @typedef {object} SendEmailRegisterRequest
 * @property {string} email.required - User's email address
 */

/**
 * POST /auth/send/email/register
 * @summary Send Email Register
 * @tags auth
 * @param {SendEmailRegisterRequest} request.body.required - User's email address
 * @return {EmailVerificationResponse} 201 - Success response - application/json
 * @return {string} 409 - Conflict Error - application/json
 * @return {string} 500 - Internal Error - application/json
 */

/**
 * @typedef {object} verifyEmailRequest
 * @property {string} token.required - Token to verify
 * @property {string} type.required - Token type
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
 * Register Request
 * @typedef {object} RegisterRequest
 * @property {string} userId - User's ID
 * @property {string} password - User's password
 * @property {string} confirmPassword - User's password confirmation
 * @property {string} name - User's name
 * @property {string} username - User's username
 * @property {Array<string>} userPolicy - User's policy agreement
 */

/**
 * POST /auth/local/register
 * @summary Local Register
 * @security bearerAuth
 * @tags auth
 * @param {RegisterRequest} request.body.required - User update request
 * @return {AuthSuccessResponse} 200 - Success response - application/json
 * @return {string} 404 - User not found - application/json
 * @return {string} 400 - Bad request - application/json
 * @return {string} 409 - Conflict Error - application/json
 * @return {string} 401 - Unauthorized - application/json
 * @return {string} 403 - Forbidden - application/json
 * @return {string} 500 - Internal server error - application/json
 */

/**
 * @typedef {object} SendEmailResetPasswordRequest
 * @property {string} email.required - User's email address
 */

/**
 * POST /auth/send/email/reset-password
 * @summary Send Email Reset Password
 * @tags auth
 * @param {SendEmailResetPasswordRequest} request.body.required - User's email address
 * @return {EmailVerificationResponse} 201 - Success response - application/json
 * @return {string} 409 - Conflict Error - application/json
 * @return {string} 500 - Internal Error - application/json
 */

/**
 * @typedef {object} ResetPasswordRequest
 * @property {string} userId - User's ID
 * @property {string} password.required - New password
 * @property {string} confirmPassword.required - New password confirmation
 */

/**
 * @typedef {object} ResetPasswordResponse
 * @property {User} user - User data
 */

/**
 * POST /auth/local/reset-password
 * @summary Local Reset Password
 * @tags auth
 * @param {ResetPasswordRequest} request.body.required - User reset password request
 * @return {ResetPasswordResponse} 201 - Success response - application/json
 * @return {string} 400 - Bad request - application/json
 * @return {string} 404 - User not found - application/json
 * @return {string} 500 - Internal Error - application/json
 */

authRouter.post(
  '/validate',
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.authValidate,
  }),
  authController.authValidate,
);

authRouter.post(
  '/google/login',
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.localAuth,
  }),
  authController.googleAuth,
);

authRouter.post(
  '/local/login',
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.localAuth,
  }),
  authController.localAuth,
);

authRouter.post(
  '/send/email/register',
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.sendEmailRegister,
  }),
  authController.sendEmailRegister,
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
  '/local/register',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.register,
  }),
  authorizeMiddleware(Actions.Create, 'register'),
  authController.register,
);

authRouter.post(
  '/send/email/reset-password',
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.sendEmailResetPassword,
  }),
  authController.sendEmailResetPassword,
);

authRouter.post(
  '/local/reset-password',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.resetPassword,
  }),
  authController.resetPassword,
);

export default authRouter;
