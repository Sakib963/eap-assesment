import { z } from 'zod';
import { BANGLADESH_MOBILE_NUMBER_MESSAGE, BANGLADESH_MOBILE_NUMBER_REGEX } from '../utils/phone.js';

const role = z.enum(['manager', 'salesman']);
const status = z.enum(['active', 'inactive']);

export const listUsersSchema = z.object({
  params: z.object({}),
  body: z.object({}),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional().default(''),
    role: role.optional(),
    status: status.optional(),
  }),
});

export const createUserSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(6).max(72),
    name: z.string().trim().min(2).max(255),
    phone: z
      .string()
      .trim()
      .regex(BANGLADESH_MOBILE_NUMBER_REGEX, BANGLADESH_MOBILE_NUMBER_MESSAGE),
    role,
    status: status.optional().default('active'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
  body: z
    .object({
      email: z.string().trim().email().max(255).optional(),
      password: z.string().min(6).max(72).optional(),
      name: z.string().trim().min(2).max(255).optional(),
      phone: z
        .string()
        .trim()
        .regex(BANGLADESH_MOBILE_NUMBER_REGEX, BANGLADESH_MOBILE_NUMBER_MESSAGE)
        .optional(),
      role: role.optional(),
      status: status.optional(),
    })
    .refine((body) => Object.values(body).some((v) => v !== undefined), {
      message: 'At least one user field is required',
    }),
});

export const changeUserStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({}),
  body: z.object({
    status,
  }),
});
