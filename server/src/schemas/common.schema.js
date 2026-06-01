import { z } from 'zod';
import { assertValidHistoryRange, DATE_REGEX, isValidIanaTimezone, TIME_REGEX } from '../utils/dates.js';

export const dateQueryField = z.string().regex(DATE_REGEX, 'must be YYYY-MM-DD');

export const ianaTimezoneField = z
  .string()
  .min(1)
  .refine((tz) => isValidIanaTimezone(tz), { message: 'timezone must be a valid IANA name' });

export const scheduleSchema = z.object({
  start: z.string().regex(TIME_REGEX, 'schedule.start must be HH:mm'),
  end: z.string().regex(TIME_REGEX, 'schedule.end must be HH:mm'),
});

/**
 * @param {string} from
 * @param {string} to
 * @param {import('zod').RefinementCtx} ctx
 * @param {import('zod').ZodIssueCode} [issuePath]
 */
export function refineHistoryDateRange(from, to, ctx, issuePath = ['query', 'to']) {
  const range = assertValidHistoryRange(from, to);
  if (!range.ok) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: range.message,
      path: issuePath,
    });
  }
}

/**
 * @param {{ query: { from: string; to: string } }} data
 * @param {import('zod').RefinementCtx} ctx
 */
export function refineQueryHistoryRange(data, ctx) {
  refineHistoryDateRange(data.query.from, data.query.to, ctx);
}
