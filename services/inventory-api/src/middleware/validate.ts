import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';
import { ZodError } from 'zod';
import { sendError } from '../utils/api-response.js';

export const validate = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body ?? {},
        query: req.query ?? {},
        params: req.params ?? {},
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', details);
        return;
      }

      sendError(res, 500, 'VALIDATION_MIDDLEWARE_ERROR', 'Validation middleware failure');
    }
  };
};
