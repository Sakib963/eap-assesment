import { z } from 'zod';

export const echoSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(200),
  }),
  query: z.object({}),
  params: z.object({}),
});
