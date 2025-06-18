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
 * @property {string} firstname - User's firstname
 * @property {string} lastname - User's lastname
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
 * @typedef {object} AuthProviderSuccessResponse
 * @property {string} id - Auth provider ID
 * @property {string} userId - User ID
 * @property {string} authProvider - Authentication provider name
 * @property {string} providerUserId - Provider's user ID
 * @property {string} providerEmail - Provider's email address
 * @property {Date} linkedAt - Timestamp when the provider was linked
 */

/**
 * @typedef {object} UserAuth
 * @property {string} id - User ID
 * @property {string} firstname - User's firstname
 * @property {string} lastname - User's lastname
 * @property {string} phoneNumber - User's phone number
 * @property {string} bio - User's biography
 * @property {string} username - User's username
 * @property {string} password - User's password
 * @property {string} email - User's email address
 * @property {string} imageUrl - URL to user's profile image
 * @property {string} status - User's status
 * @property {string} latestLoginAt - Last login timestamp
 * @property {string} createdAt - Account creation timestamp
 * @property {string} updatedAt - Last update timestamp
 * @property {AuthProviderSuccessResponse} AuthProvider - Authentication provider
 */

/**
 * @typedef {object} AuthSuccessResponse
 * @property {UserAuth} user - User data
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
 * @typedef {object} AuthValidateResponse
 * @property {string} user - user
 */

/**
 * POST /auth/validate
 * @summary Auth Validate JWT Token
 * @tags auth
 * @param {AuthValidateRequest} request.body.required - JWT Token
 * @return {AuthValidateResponse} 200 - Success response - application/json
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
 * @param {string} x-device-id.header.required - Client's unique device identifier
 * @param {GoogleAuthRequest} request.body.required - Google Auth idToken
 * @return {AuthSuccessResponse} 200 - Success response - application/json
 * @return {string} 401 - Unauthorized - application/json
 */

/**
 * @typedef {object} GoogleLinkAccountRequest
 * @property {string} providerUserId.required - Provider's user ID
 * @property {string} providerEmail.required - Provider's email address
 */

/**
 * PATCH /auth/google/link/{id}
 * @summary Link Google Auth For User
 * @security bearerAuth
 * @tags auth
 * @param {string} id.path.required - User ID
 * @param {GoogleLinkAccountRequest} request.body.required - Google Auth provider data
 * @return {AuthProviderSuccessResponse} 200 - Success response - application/json
 * @return {string} 401 - Unauthorized - application/json
 */

/**
 * PATCH /auth/google/unlink/{id}
 * @summary Unlink Google Auth For User
 * @security bearerAuth
 * @tags auth
 * @param {string} id.path.required - User ID
 * @return {AuthProviderSuccessResponse} 200 - Success response - application/json
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
 * @param {string} x-device-id.header.required - Client's unique device identifier
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
 * @property {string} firstname - User's firstname
 * @property {string} lastname - User's lastname
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
 * @property {string} password.required - New password
 * @property {string} confirmPassword.required - New password confirmation
 */

/**
 * @typedef {object} ResetPasswordResponse
 * @property {User} user - User data
 */

/**
 * PATCH /auth/local/reset-password/{id}
 * @summary Local Reset Password
 * @tags auth
 * @param {string} id.path.required - User ID
 * @param {ResetPasswordRequest} request.body.required - User reset password request
 * @return {ResetPasswordResponse} 201 - Success response - application/json
 * @return {string} 400 - Bad request - application/json
 * @return {string} 404 - User not found - application/json
 * @return {string} 500 - Internal Error - application/json
 */

/**
 * @typedef {object} AuthProviderSuccessResponse
 * @property {string} id
 * @property {string} userId
 * @property {string} authProvider
 * @property {string} providerUserId
 * @property {string} providerEmail
 * @property {string} linkedAt
 */

/**
 * GET /auth/{userId}
 * @summary Get Auth Provider
 * @security bearerAuth
 * @tags auth
 * @param {string} userId.path.required - User ID
 * @return {AuthProviderSuccessResponse[]} 200 - User ID is available - application/json
 * @return {string} 500 - Internal Error - application/json
 */
authRouter.get(
  '/:userId',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.params,
    schema: authValidator.getAuthProvider,
  }),
  authorizeMiddleware(Actions.Read, 'getAuthProvider'),
  authController.getAuthProvider,
);

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
    schema: authValidator.googleAuth,
  }),
  authController.googleAuth,
);

authRouter.patch(
  '/google/link/:id',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.params,
    schema: authValidator.googleLinkAccountParam,
  }),
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.googleLinkAccountBody,
  }),
  authorizeMiddleware(Actions.Update, 'updateAuthProvider'),
  authController.googleLinkAccount,
);

authRouter.patch(
  '/google/unlink/:id',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.params,
    schema: authValidator.googleUnlinkAccountParam,
  }),
  authorizeMiddleware(Actions.Update, 'updateAuthProvider'),
  authController.googleUnlinkAccount,
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

authRouter.patch(
  '/local/reset-password/:id',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.params,
    schema: authValidator.resetPasswordParam,
  }),
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: authValidator.resetPasswordBody,
  }),
  authorizeMiddleware(Actions.Update, 'resetPassword'),
  authController.resetPassword,
);

export default authRouter;
