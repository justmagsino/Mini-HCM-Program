import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { authenticate, requireUser } from '../middleware/auth.middleware.js';
import { requireVerifiedEmail } from '../middleware/emailVerified.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  attendanceReadLimiter,
  punchLimiter,
} from '../middleware/rateLimiters.js';
import { historyQuerySchema, punchBodySchema } from '../schemas/attendance.schema.js';
import * as attendanceController from '../controllers/attendance.controller.js';

const router = Router();

router.use(
  asyncHandler(authenticate),
  asyncHandler(requireVerifiedEmail),
  asyncHandler(requireUser),
);

router.post(
  '/punch-in',
  punchLimiter,
  validate(punchBodySchema),
  asyncHandler(attendanceController.punchIn),
);
router.post(
  '/punch-out',
  punchLimiter,
  validate(punchBodySchema),
  asyncHandler(attendanceController.punchOut),
);
router.get('/today', attendanceReadLimiter, asyncHandler(attendanceController.getToday));
router.get(
  '/history',
  attendanceReadLimiter,
  validate(historyQuerySchema),
  asyncHandler(attendanceController.getHistory),
);

export default router;
