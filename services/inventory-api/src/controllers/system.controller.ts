import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import { echoMessage, getCurrentUser, ping } from '../services/system.service.js';

export const getPing = (_req: Request, res: Response): void => {
  sendSuccess(res, ping(), 200, 'System route is reachable');
};

export const getMe = (req: Request, res: Response): void => {
  sendSuccess(res, getCurrentUser(req.user), 200, 'Authenticated user loaded');
};

export const postEcho = (req: Request, res: Response): void => {
  sendSuccess(res, echoMessage(String(req.body.message)), 200, 'Echo generated');
};
