import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export const requestContext = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = randomUUID();
  const start = process.hrtime.bigint();

  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const elapsedNs = process.hrtime.bigint() - start;
    const elapsedMs = Number(elapsedNs) / 1_000_000;
    console.debug(`[request:${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs.toFixed(2)}ms`);
  });

  next();
};
