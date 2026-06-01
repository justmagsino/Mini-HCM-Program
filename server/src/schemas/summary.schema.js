import { z } from 'zod';
import { DATE_REGEX } from '../utils/dates.js';
import { dateQueryField, refineQueryHistoryRange } from './common.schema.js';

export const dailyDateQuerySchema = z.object({
  query: z.object({
    date: dateQueryField,
  }),
});

export const dailyRangeQuerySchema = z
  .object({
    query: z.object({
      from: z.string().regex(DATE_REGEX, 'from must be YYYY-MM-DD'),
      to: z.string().regex(DATE_REGEX, 'to must be YYYY-MM-DD'),
    }),
  })
  .superRefine(refineQueryHistoryRange);

export const weeklyQuerySchema = z.object({
  query: z.object({
    weekStart: dateQueryField,
  }),
});

export const adminDailySummaryQuerySchema = z.object({
  query: z.object({
    userId: z.string().min(1, 'userId is required'),
    date: dateQueryField,
  }),
});

const reportRoleField = z.enum(['employee', 'admin']).optional();

export const adminReportDateQuerySchema = z.object({
  query: z.object({
    date: dateQueryField,
    role: reportRoleField,
  }),
});

export const adminWeeklyReportQuerySchema = z.object({
  query: z.object({
    weekStart: dateQueryField,
    role: reportRoleField,
    q: z.string().max(200).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
  }),
});

export const exceptionsQuerySchema = z
  .object({
    query: z.object({
      from: z.string().regex(DATE_REGEX, 'from must be YYYY-MM-DD'),
      to: z.string().regex(DATE_REGEX, 'to must be YYYY-MM-DD'),
      role: reportRoleField,
    }),
  })
  .superRefine(refineQueryHistoryRange);

export const exportReportQuerySchema = z
  .object({
    query: z.object({
      from: z.string().regex(DATE_REGEX, 'from must be YYYY-MM-DD'),
      to: z.string().regex(DATE_REGEX, 'to must be YYYY-MM-DD'),
      role: reportRoleField,
    }),
  })
  .superRefine(refineQueryHistoryRange);
