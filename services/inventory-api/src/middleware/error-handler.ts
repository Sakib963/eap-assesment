import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/api-response.js';

interface PgError extends Error {
  code?: string;
  detail?: string;
}

export interface HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;
}

export const createHttpError = (
  status: number,
  message: string,
  code = 'HTTP_ERROR',
  details?: unknown
): HttpError => {
  const error = new Error(message) as HttpError;
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
};

const isPgError = (error: unknown): error is PgError => {
  return Boolean(error) && typeof error === 'object' && 'code' in (error as object);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`);
};

export const globalErrorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof ZodError) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', error.issues);
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'code' in error &&
    typeof (error as HttpError).status === 'number'
  ) {
    const httpError = error as HttpError;
    sendError(res, httpError.status, httpError.code, httpError.message, httpError.details);
    return;
  }

  if (isPgError(error)) {
    const pgErrorCodeMap: Record<string, { status: number; code: string; message: string }> = {
      '23505': { status: 409, code: 'UNIQUE_CONSTRAINT', message: 'Duplicate record detected' },
      '23503': { status: 400, code: 'FK_CONSTRAINT', message: 'Related record not found' },
      '23502': { status: 400, code: 'NOT_NULL_VIOLATION', message: 'Required field is missing' },
      '22P02': { status: 400, code: 'INVALID_INPUT', message: 'Invalid input format' },
    };

    if (error.code && pgErrorCodeMap[error.code]) {
      const mapped = pgErrorCodeMap[error.code];
      sendError(res, mapped.status, mapped.code, mapped.message, error.detail);
      return;
    }
  }

  const fallbackMessage = error instanceof Error ? error.message : 'Unexpected server error';
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', fallbackMessage);
};
