import express from 'express';
import { policyController } from '../controllers';

const policyRouter: express.Router = express.Router();

/**
 * Policy Success Response Type
 * @typedef {object} PolicySuccessResponse
 * @property {string} id - Policy ID
 * @property {string} type - Policy type
 * @property {string} content - Policy content
 * @property {string} version - Policy version
 * @property {string} createdAt - Policy creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */

/**
 * GET /policy
 * @summary Get Policy information
 * @tags policy
 * @return {PolicySuccessResponse} 200 - Success response - application/json
 */
policyRouter.get('/', policyController.getPolicy);

export default policyRouter;
