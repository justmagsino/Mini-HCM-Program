import { z } from 'zod';
import { DATE_REGEX } from '../utils/dates.js';
import { dateQueryField, ianaTimezoneField, scheduleSchema } from './common.schema.js';

export const listUsersQuerySchema = z.object({
  query: z.object({
    q: z.string().max(100).optional(),
    role: z.enum(['employee', 'admin']).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
});

const firebaseUid = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/, 'uid must be a valid Firebase user id');

export const uidParamSchema = z.object({
  params: z.object({
    uid: firebaseUid,
  }),
});

export const patchUserBodySchema = z.object({
  params: z.object({
    uid: firebaseUid,
  }),
  body: z
    .object({
      fullName: z.string().trim().min(2).max(100).optional(),
      timezone: ianaTimezoneField.optional(),
      schedule: scheduleSchema.optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

export const patchRoleBodySchema = z.object({
  params: z.object({
    uid: firebaseUid,
  }),
  body: z
    .object({
      role: z.enum(['employee', 'admin']),
    })
    .strict(),
});

export const searchAttendanceQuerySchema = z
  .object({
    query: z.object({
      date: z.string().regex(DATE_REGEX).optional(),
      userId: firebaseUid.optional(),
      status: z.enum(['open', 'closed']).optional(),
      q: z.string().max(100).optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(50),
    }),
  })
  .refine((data) => Boolean(data.query.date || data.query.userId), {
    message: 'At least one of date or userId is required',
    path: ['query', 'date'],
  });

export const attendanceMutationBodySchema = z
  .object({
    timeIn: z.string().datetime({ message: 'timeIn must be ISO 8601' }),
    timeOut: z.string().datetime({ message: 'timeOut must be ISO 8601' }),
    reason: z.string().trim().min(10).max(500),
  })
  .strict()
  .refine((body) => new Date(body.timeOut) > new Date(body.timeIn), {
    message: 'timeOut must be after timeIn',
    path: ['timeOut'],
  });

export const createAttendanceBodySchema = z.object({
  body: attendanceMutationBodySchema.extend({
    userId: firebaseUid,
    date: z.string().regex(DATE_REGEX),
  }),
});

export const patchAttendanceBodySchema = z.object({
  params: z.object({
    userId: firebaseUid,
    date: z.string().regex(DATE_REGEX),
  }),
  body: attendanceMutationBodySchema,
});

export const dashboardKpisQuerySchema = z.object({
  query: z.object({
    date: dateQueryField,
  }),
});
