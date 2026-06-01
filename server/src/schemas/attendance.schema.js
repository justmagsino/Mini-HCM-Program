import { z } from 'zod';
import { DATE_REGEX, MAX_HISTORY_DAYS } from '../utils/dates.js';
import { refineQueryHistoryRange } from './common.schema.js';

export const historyQuerySchema = z
  .object({
    query: z.object({
      from: z.string().regex(DATE_REGEX, 'from must be YYYY-MM-DD'),
      to: z.string().regex(DATE_REGEX, 'to must be YYYY-MM-DD'),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(MAX_HISTORY_DAYS).optional().default(31),
    }),
  })
  .superRefine(refineQueryHistoryRange);

export const punchBodySchema = z.object({
  body: z.object({}).strict(),
});
