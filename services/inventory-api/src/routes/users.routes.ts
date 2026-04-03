import { Router } from 'express';
import {
  createUserHandler,
  listUsersHandler,
  setUserStatusHandler,
  updateUserHandler,
} from '../controllers/users.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  changeUserStatusSchema,
  createUserSchema,
  listUsersSchema,
  updateUserSchema,
} from '../schemas/users.schema.js';

const usersRouter = Router();

usersRouter.use(requireAuth, requireRoles(['manager']));

usersRouter.get('/', validate(listUsersSchema), asyncHandler(listUsersHandler));
usersRouter.post('/', validate(createUserSchema), asyncHandler(createUserHandler));
usersRouter.patch('/:id', validate(updateUserSchema), asyncHandler(updateUserHandler));
usersRouter.patch('/:id/status', validate(changeUserStatusSchema), asyncHandler(setUserStatusHandler));

export default usersRouter;
