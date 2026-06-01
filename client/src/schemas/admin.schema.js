import { z } from 'zod';
import { DATE_REGEX } from '../utils/dates.js';
import { ianaTimezoneField } from './common.schema.js';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const editUserSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  timezone: ianaTimezoneField,
  scheduleStart: z.string().regex(timeRegex, 'Use HH:mm'),
  scheduleEnd: z.string().regex(timeRegex, 'Use HH:mm'),
});

const attendanceEditFields = z.object({
  timeIn: z.string().min(1, 'Time in is required'),
  timeOut: z.string().min(1, 'Time out is required'),
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters').max(500),
});

/** @param {z.ZodObject<any>} schema */
function withAttendanceTimeOrder(schema) {
  return schema.refine((data) => new Date(data.timeOut) > new Date(data.timeIn), {
    message: 'Time out must be after time in',
    path: ['timeOut'],
  });
}

export const attendanceEditSchema = withAttendanceTimeOrder(attendanceEditFields);

export const createAttendanceSchema = withAttendanceTimeOrder(
  attendanceEditFields.extend({
    userId: z.string().min(1),
    date: z.string().regex(DATE_REGEX),
  }),
);
