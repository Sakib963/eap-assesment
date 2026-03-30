import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError } from '../utils/api-response.js';
import type { AuthenticatedUser } from '../types/api.js';

interface JwtPayload {
  sub: string;
  email: string;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user: AuthenticatedUser = {
      userId: payload.sub,
      email: payload.email,
    };
    req.user = user;
    next();
  } catch {
    sendError(res, 401, 'INVALID_TOKEN', 'Token is invalid or expired');
  }
};
