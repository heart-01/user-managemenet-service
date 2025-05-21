import express from 'express';
import userValidator from '../validators/user.validator';
import { authenticateMiddleware } from '../middlewares/authentication';
import { validateSchemaMiddleware, JOI_OPTIONS } from '../middlewares/validation';
import { authorizeMiddleware } from '../middlewares/authorize';
import { Actions } from '../enums/ability.enum';
import { userController } from '../controllers';

const userRouter: express.Router = express.Router();

/**
 * User Success Response Type
 * @typedef {object} UserSuccessResponse
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
 * @property {string} deletedAt - Delete timestamp
 */

/**
 * Update user type
 * @typedef {object} UpdateUserBodyType
 * @property {string} bio - User's biography
 * @property {string} firstname - User's firstname
 * @property {string} lastname - User's lastname
 * @property {string} password  - User's password
 * @property {string} username  - User's username
 */

/**
 * User Deletion Feedback Request Type
 * @typedef {object} userDeletionFeedbackRequest
 * @property {string} reason - Reason for account deletion
 */

/**
 * User Deletion Feedback Response Type
 * @typedef {object} userDeletionFeedbackResponse
 * @property {string} id - User deletion feedback ID
 * @property {string} userId - User ID
 * @property {string} reason - Reason for account deletion
 * @property {string} createdAt - Feedback creation timestamp
 */

/**
 * Send Email Delete Account Request Type
 * @typedef {object} verifyEmailRequest
 * @property {string} token.required - Token to verify
 * @property {string} type.required - Token type
 */

/**
 * Verify Email Success Response Type
 * @typedef {object} verifyEmailSuccessResponse
 * @property {string} token - token
 * @property {string} userId - user id
 * @property {string} type - action type for the token
 * @property {string} createdAt - token creation timestamp
 * @property {string} expiredAt - token expiration timestamp
 * @property {string} completedAt - token completion timestamp
 */

/**
 * Send Email Delete Account Request Type
 * @typedef {object} sendEmailDeleteAccountRequest
 * @property {string} email.required - Email to send delete account link
 */

/**
 * Send Email Delete Account Response Type
 * @typedef {object} sendEmailDeleteAccountResponse
 * @property {string} token - token
 * @property {string} userId - user id
 * @property {string} type - action type for the token
 * @property {string} createdAt - token creation timestamp
 * @property {string} expiredAt - token expiration timestamp
 * @property {string} completedAt - token completion timestamp
 */

/**
 * User Device Session Response Type
 * @typedef {object} UserDeviceSessionResponse
 * @property {string} id - Device session ID
 * @property {string} userId - User ID
 * @property {string} deviceId - Device ID
 * @property {string} deviceName - Device name
 * @property {string} ipAddress - IP address
 * @property {string} createdAt - Session creation timestamp
 * @property {string} lastActiveAt - Last active timestamp
 * @property {boolean} isRevoked - Session revoked status
 */

/**
 * Check Username Response Type
 * @typedef {object} CheckUsernameResponse
 * @property {boolean} isValid - Indicates if the username is valid
 * @property {string} changeCount - Number of changes made
 */

/**
 * GET /user/check-username
 * @summary Check if username is available
 * @tags users
 * @param {string} userId.query.required - User ID
 * @param {string} username.query.required - Username
 * @return {CheckUsernameResponse} 200 - Success response - application/json
 * @return {string} 500 - Internal server error - application/json
 */
userRouter.get(
  '/check-username',
  validateSchemaMiddleware({
    options: JOI_OPTIONS.query,
    schema: userValidator.checkUsername,
  }),
  userController.checkUsername,
);

/**
 * GET /user/{id}
 * @summary Get User's information
 * @security bearerAuth
 * @tags users
 * @param {string} id.path.required - User ID
 * @return {UserSuccessResponse} 200 - Success response - application/json
 * @return {string} 404 - User not found - application/json
 */
userRouter.get(
  '/:id',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.params,
    schema: userValidator.getUserById,
  }),
  authorizeMiddleware(Actions.Read, 'getUserById'),
  userController.getUserById,
);

/**
 * PATCH /user/{id}
 * @summary Update User's information
 * @security bearerAuth
 * @tags users
 * @param {string} id.path.required - User ID
 * @param {UpdateUserBodyType} request.body.required
 * @return {UserSuccessResponse} 200 - Success response - application/json
 * @return {string} 404 - User not found - application/json
 */
userRouter.patch(
  '/:id',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.params,
    schema: userValidator.updateUserParam,
  }),
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: userValidator.updateUserBody,
  }),
  authorizeMiddleware(Actions.Update, 'updateUser'),
  userController.updateUser,
);

/**
 * DELETE /user/{id}
 * @summary Delete User's information
 * @security bearerAuth
 * @tags users
 * @param {string} id.path.required - User ID
 * @return {UserSuccessResponse} 200 - Success response - application/json
 * @return {string} 404 - User not found - application/json
 */
userRouter.delete(
  '/:id',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.params,
    schema: userValidator.deleteUser,
  }),
  authorizeMiddleware(Actions.Delete, 'deleteUser'),
  userController.deleteUser,
);

/**
 * POST /user/{id}/deletion-feedback
 * @summary User deletion feedback
 * @security bearerAuth
 * @tags users
 * @param {string} id.path.required - User ID
 * @param {userDeletionFeedbackRequest} request.body.required - User deletion feedback
 * @return {userDeletionFeedbackResponse} 200 - Success response - application/json
 * @return {string} 404 - User not found - application/json
 * @return {string} 500 - Internal server error - application/json
 */
userRouter.post(
  '/:id/deletion-feedback',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.params,
    schema: userValidator.userDeletionFeedbackParam,
  }),
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: userValidator.userDeletionFeedbackBody,
  }),
  authorizeMiddleware(Actions.Create, 'userDeletionFeedback'),
  userController.userDeletionFeedback,
);

/**
 * POST /user/send/email/delete-account
 * @summary Send email to delete account
 * @security bearerAuth
 * @tags users
 * @param {sendEmailDeleteAccountRequest} request.body.required - Email to send delete account link
 * @return {sendEmailDeleteAccountResponse} 200 - Success response - application/json
 * @return {string} 500 - Internal server error - application/json
 */
userRouter.post(
  '/send/email/delete-account',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: userValidator.sendEmailDeleteAccount,
  }),
  userController.sendEmailDeleteAccount,
);

/**
 * POST /user/verify/email
 * @summary Verify Email
 * @security bearerAuth
 * @tags auth
 * @param {verifyEmailRequest} request.body.required - Token to verify
 * @return {verifyEmailSuccessResponse} 201 - Success response - application/json
 * @return {string} 500 - Internal Error - application/json
 */
userRouter.post(
  '/verify/email',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: userValidator.verifyEmail,
  }),
  userController.verifyEmail,
);

/**
 * GET /user/{id}/session
 * @summary Get User Device Session Active
 * @security bearerAuth
 * @tags users
 * @param {string} id.path.required - User ID
 * @return {Array<UserDeviceSessionResponse>} 201 - Success response - application/json
 * @return {string} 500 - Internal Error - application/json
 */
userRouter.get(
  '/:id/session',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.params,
    schema: userValidator.getUserDeviceSessionActive,
  }),
  userController.getUserDeviceSessionActive,
);

/**
 * PATCH /user/{id}/session
 * @summary Update User Device Session Active
 * @security bearerAuth
 * @tags users
 * @param {string} id.path.required - User ID
 * @return {Array<UserDeviceSessionResponse>} 201 - Success response - application/json
 * @return {string} 500 - Internal Error - application/json
 */
userRouter.patch(
  '/:id/session',
  authenticateMiddleware,
  validateSchemaMiddleware({
    options: JOI_OPTIONS.params,
    schema: userValidator.updateUserDeviceSessionActiveParam,
  }),
  validateSchemaMiddleware({
    options: JOI_OPTIONS.body,
    schema: userValidator.updateUserDeviceSessionActiveBody,
  }),
  userController.updateUserDeviceSessionActive,
);

export default userRouter;
