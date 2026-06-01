/**
 * Service bridge: maps computation engine errors to AppError for HTTP layer.
 */

import { AppError } from '../utils/errors.js';
import { ComputationError } from '../engines/computation.errors.js';
import {
  computeAttendanceMetrics,
  computeAttendanceMetricsFromValues,
} from '../engines/computation.engine.js';

/**
 * @param {import('../engines/computation.engine.js').ComputeAttendanceMetricsInput} input
 */
export function calculateAttendanceMetrics(input) {
  try {
    return computeAttendanceMetrics(input);
  } catch (err) {
    if (err instanceof ComputationError) {
      const statusCode = err.code === 'INVALID_ATTENDANCE_STATE' ? 400 : 400;
      throw new AppError(statusCode, err.code, err.message);
    }
    throw err;
  }
}

/**
 * @param {Parameters<typeof computeAttendanceMetricsFromValues>[0]} params
 */
export function calculateAttendanceMetricsFromValues(params) {
  try {
    return computeAttendanceMetricsFromValues(params);
  } catch (err) {
    if (err instanceof ComputationError) {
      throw new AppError(400, err.code, err.message);
    }
    throw err;
  }
}
