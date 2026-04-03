import { z } from 'zod';
import { BANGLADESH_MOBILE_NUMBER_MESSAGE, BANGLADESH_MOBILE_NUMBER_REGEX } from '../utils/phone.js';

const email = z.string().email().max(255);
const password = z.string().min(6).max(72);

export const signupSchema = z.object({
  body: z.object({
    email,
    password,
    name: z.string().trim().min(2).max(255),
    phone: z
      .string()
      .trim()
      .regex(BANGLADESH_MOBILE_NUMBER_REGEX, BANGLADESH_MOBILE_NUMBER_MESSAGE),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const demoLoginSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: z.object({}),
});

export const forgotPasswordRequestSchema = z.object({
  body: z.object({
    email,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const forgotPasswordVerifySchema = z.object({
  body: z.object({
    email,
    otp: z.string().trim().min(4).max(10),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const forgotPasswordResetSchema = z.object({
  body: z.object({
    email,
    otp: z.string().trim().min(4).max(10),
    new_password: password,
  }),
  params: z.object({}),
  query: z.object({}),
});
