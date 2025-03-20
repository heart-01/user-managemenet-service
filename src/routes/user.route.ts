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
 * @property {string} deletedAt - Delete timestamp
 */

/**
 * Update user type
 * @typedef {object} UpdateUserBodyType
 * @property {string} bio
 * @property {string} name
 * @property {string} password
 * @property {string} username
 */

/**
 * GET /user/check-username
 * @summary Check if username is available
 * @tags users
 * @param {string} username.query.required - Username
 * @return {boolean} 200 - Username is available - application/json
 * @return {boolean} 200 - Username is not available - application/json
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

export default userRouter;
