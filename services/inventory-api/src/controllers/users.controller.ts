import type { Request, Response } from 'express';
import { createHttpError } from '../middleware/error-handler.js';
import { sendSuccess } from '../utils/api-response.js';
import {
  createUser,
  listUsers,
  setUserStatus,
  updateUser,
  type UserRole,
  type UserStatus,
} from '../services/users.service.js';

export const listUsersHandler = async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 10);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const role = typeof req.query.role === 'string' ? (req.query.role as UserRole) : undefined;
  const status = typeof req.query.status === 'string' ? (req.query.status as UserStatus) : undefined;

  const result = await listUsers({ page, pageSize, search, role, status });
  sendSuccess(res, result);
};

export const createUserHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorEmail = req.user?.email ?? 'system';
    const created = await createUser({
      email: String(req.body.email),
      password: String(req.body.password),
      name: req.body.name ?? null,
      phone: req.body.phone ?? null,
      role: req.body.role as UserRole,
      status: (req.body.status as UserStatus | undefined) ?? 'active',
      actorEmail,
    });

    sendSuccess(res, created, 201, 'User created successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      throw createHttpError(409, 'Email is already registered', 'EMAIL_ALREADY_EXISTS');
    }

    throw error;
  }
};

export const updateUserHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorEmail = req.user?.email ?? 'system';
    const updated = await updateUser(String(req.params.id), {
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      phone: req.body.phone,
      role: req.body.role,
      status: req.body.status,
      actorEmail,
    });

    if (!updated) {
      throw createHttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    sendSuccess(res, updated, 200, 'User updated successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      throw createHttpError(409, 'Email is already registered', 'EMAIL_ALREADY_EXISTS');
    }

    throw error;
  }
};

export const setUserStatusHandler = async (req: Request, res: Response): Promise<void> => {
  const actorEmail = req.user?.email ?? 'system';
  const userId = String(req.params.id);
  const status = String(req.body.status) as UserStatus;

  const updated = await setUserStatus(userId, status, actorEmail);
  if (!updated) {
    throw createHttpError(404, 'User not found', 'USER_NOT_FOUND');
  }

  sendSuccess(res, updated, 200, `User ${status === 'active' ? 'activated' : 'inactivated'} successfully`);
};
