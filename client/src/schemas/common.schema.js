import { z } from 'zod';
import { DATE_REGEX, MAX_HISTORY_DAYS } from '../utils/dates.js';
import { isValidIanaTimezone } from '../utils/timezone.js';

export const ianaTimezoneField = z
  .string()
  .min(1)
  .refine((tz) => isValidIanaTimezone(tz), { message: 'Enter a valid IANA timezone' });

export const historyDateRangeSchema = z
  .object({
    from: z.string().regex(DATE_REGEX, 'Use YYYY-MM-DD'),
    to: z.string().regex(DATE_REGEX, 'Use YYYY-MM-DD'),
  })
  .refine((data) => data.to >= data.from, {
    message: 'End date must be on or after start date',
    path: ['to'],
  })
  .refine((data) => {
    const fromMs = new Date(`${data.from}T00:00:00Z`).getTime();
    const toMs = new Date(`${data.to}T00:00:00Z`).getTime();
    const days = Math.floor((toMs - fromMs) / 86_400_000) + 1;
    return days <= MAX_HISTORY_DAYS;
  }, {
    message: `Date range cannot exceed ${MAX_HISTORY_DAYS} days`,
    path: ['to'],
  });
