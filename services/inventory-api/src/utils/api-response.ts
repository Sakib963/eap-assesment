import type { Response } from 'express';
import type { ApiError, ApiSuccess } from '../types/api.js';

const now = (): string => new Date().toISOString();

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): Response<ApiSuccess<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: now(),
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): Response<ApiError> => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: now(),
  });
};
