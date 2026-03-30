import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/api-response.js';
import { demoLogin, getMe, login, signup } from '../services/auth.service.js';

export const postSignup = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  try {
    const result = await signup(email, password);
    sendSuccess(res, result, 201, 'Account created successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      sendError(res, 409, 'EMAIL_ALREADY_EXISTS', 'Email is already registered');
      return;
    }

    throw error;
  }
};

export const postLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  try {
    const result = await login(email, password);
    sendSuccess(res, result, 200, 'Login successful');
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      return;
    }

    throw error;
  }
};

export const postDemoLogin = async (_req: Request, res: Response): Promise<void> => {
  const result = await demoLogin();
  sendSuccess(res, result, 200, 'Demo login successful');
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
    return;
  }

  const user = await getMe(req.user.userId);
  if (!user) {
    sendError(res, 404, 'USER_NOT_FOUND', 'Authenticated user not found');
    return;
  }

  sendSuccess(res, { user }, 200, 'Current user loaded');
};
