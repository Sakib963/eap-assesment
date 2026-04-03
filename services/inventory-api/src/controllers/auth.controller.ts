import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/api-response.js';
import {
  demoLogin,
  getMe,
  login,
  requestPasswordReset,
  resetPasswordWithOtp,
  signup,
  verifyPasswordResetOtp,
} from '../services/auth.service.js';

export const postSignup = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, phone } = req.body as {
    email: string;
    password: string;
    name: string;
    phone: string;
  };

  try {
    const result = await signup(email, password, name, phone);
    sendSuccess(res, result, 201, 'Account created successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      sendError(res, 409, 'EMAIL_ALREADY_EXISTS', 'Email is already registered');
      return;
    }

    if (error instanceof Error && error.message === 'USER_SCHEMA_NOT_MIGRATED') {
      sendError(res, 500, 'USER_SCHEMA_NOT_MIGRATED', 'Database migration pending: run migrate:latest');
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

    if (error instanceof Error && error.message === 'USER_SCHEMA_NOT_MIGRATED') {
      sendError(res, 500, 'USER_SCHEMA_NOT_MIGRATED', 'Database migration pending: run migrate:latest');
      return;
    }

    if (error instanceof Error && error.message === 'INACTIVE_ACCOUNT') {
      sendError(res, 403, 'INACTIVE_ACCOUNT', 'Your account is inactive. Please contact your manager.');
      return;
    }

    throw error;
  }
};

export const postForgotPasswordRequest = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };

  try {
    const result = await requestPasswordReset(email);
    sendSuccess(res, result, 200, 'Email exists. Default OTP is 1234.');
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_NOT_FOUND') {
      sendError(res, 404, 'EMAIL_NOT_FOUND', 'Email does not exist');
      return;
    }

    throw error;
  }
};

export const postForgotPasswordVerify = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body as { email: string; otp: string };

  try {
    const result = await verifyPasswordResetOtp(email, otp);
    sendSuccess(res, result, 200, 'OTP verified successfully');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'RESET_REQUEST_NOT_FOUND') {
        sendError(res, 404, 'RESET_REQUEST_NOT_FOUND', 'Password reset request not found');
        return;
      }
      if (error.message === 'RESET_OTP_EXPIRED') {
        sendError(res, 400, 'RESET_OTP_EXPIRED', 'OTP has expired');
        return;
      }
      if (error.message === 'RESET_OTP_ATTEMPTS_EXCEEDED') {
        sendError(res, 429, 'RESET_OTP_ATTEMPTS_EXCEEDED', 'Too many invalid OTP attempts');
        return;
      }
      if (error.message === 'INVALID_OTP') {
        sendError(res, 400, 'INVALID_OTP', 'Invalid OTP');
        return;
      }
    }

    throw error;
  }
};

export const postForgotPasswordReset = async (req: Request, res: Response): Promise<void> => {
  const { email, otp, new_password } = req.body as {
    email: string;
    otp: string;
    new_password: string;
  };

  try {
    const result = await resetPasswordWithOtp(email, otp, new_password);
    sendSuccess(res, result, 200, 'Password reset successful');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'RESET_REQUEST_NOT_FOUND') {
        sendError(res, 404, 'RESET_REQUEST_NOT_FOUND', 'Password reset request not found');
        return;
      }
      if (error.message === 'RESET_OTP_EXPIRED') {
        sendError(res, 400, 'RESET_OTP_EXPIRED', 'OTP has expired');
        return;
      }
      if (error.message === 'RESET_OTP_ATTEMPTS_EXCEEDED') {
        sendError(res, 429, 'RESET_OTP_ATTEMPTS_EXCEEDED', 'Too many invalid OTP attempts');
        return;
      }
      if (error.message === 'INVALID_OTP') {
        sendError(res, 400, 'INVALID_OTP', 'Invalid OTP');
        return;
      }
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
