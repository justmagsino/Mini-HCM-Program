import { z } from 'zod';

export const registerBodySchema = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(2).max(100),
    })
    .strict(),
});

export const patchProfileBodySchema = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(2).max(100),
    })
    .strict(),
});
