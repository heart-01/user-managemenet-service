import express from 'express';

import authRouter from './auth.route';
import usersRouter from './user.route';
import policyRouter from './policy.route';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/user', usersRouter);
router.use('/policy', policyRouter);

export default router;
