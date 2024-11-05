import express from 'express';
import { userController } from '../controllers';
import { validateSchemaMiddleware, JOI_OPTIONS } from '../middlewares/validation';
import userValidator from '../validators/user.validator';

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
 * @property {string} profileImageUrl - URL to user's profile image
 * @property {string} status - User's status
 * @property {string} createdAt - Account creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */

/**
 * Error 404 Response Type
 * @typedef {object} RecordNotFoundError
 * @property {string} message - Error message
 */

/**
 * GET /api/users/{id}
 * @summary Get User's information
 * @tags users
 * @param {string} id.path.required - User ID
 * @return {UserSuccessResponse} 200 - Success response - application/json
 * @return {RecordNotFoundError} 404 - User not found - application/json
 */

userRouter.get(
  '/:id',
  validateSchemaMiddleware({
    options: JOI_OPTIONS.params,
    schema: userValidator.getUserById,
  }),
  userController.getUserById,
);

export default userRouter;
