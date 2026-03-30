import { z } from 'zod';

const email = z.string().email().max(255);
const password = z.string().min(6).max(72);

export const signupSchema = z.object({
  body: z.object({
    email,
    password,
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
