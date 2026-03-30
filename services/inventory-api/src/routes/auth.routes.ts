import { Router } from 'express';
import {
  getCurrentUser,
  postDemoLogin,
  postLogin,
  postSignup,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validate } from '../middleware/validate.js';
import { demoLoginSchema, loginSchema, signupSchema } from '../schemas/auth.schema.js';

export const authRouter = Router();

authRouter.post('/signup', validate(signupSchema), asyncHandler(postSignup));
authRouter.post('/login', validate(loginSchema), asyncHandler(postLogin));
authRouter.post('/demo-login', validate(demoLoginSchema), asyncHandler(postDemoLogin));
authRouter.get('/me', requireAuth, asyncHandler(getCurrentUser));
