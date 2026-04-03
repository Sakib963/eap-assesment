import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import db from '../config/database.js';
import { sendError } from '../utils/api-response.js';
import type { AuthenticatedUser } from '../types/api.js';

interface JwtPayload {
  sub: string;
  email: string;
  role: 'manager' | 'salesman';
  status: 'active' | 'inactive';
}

interface UserAuthRow {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'manager' | 'salesman';
  status: 'active' | 'inactive';
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;

    const userRow = await db<UserAuthRow>('users')
      .select('id', 'email', 'name', 'phone', 'role', 'status')
      .where({ id: payload.sub })
      .first();

    if (!userRow) {
      sendError(res, 401, 'UNAUTHORIZED', 'User not found');
      return;
    }

    if (userRow.status !== 'active') {
      sendError(res, 403, 'INACTIVE_ACCOUNT', 'Your account is inactive');
      return;
    }

    const user: AuthenticatedUser = {
      userId: userRow.id,
      email: userRow.email,
      role: userRow.role,
      status: userRow.status,
      name: userRow.name,
      phone: userRow.phone,
    };
    req.user = user;
    next();
  } catch {
    sendError(res, 401, 'INVALID_TOKEN', 'Token is invalid or expired');
  }
};

export const requireRoles =
  (allowedRoles: Array<'manager' | 'salesman'>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 403, 'FORBIDDEN', 'You do not have permission to access this resource');
      return;
    }

    next();
  };
