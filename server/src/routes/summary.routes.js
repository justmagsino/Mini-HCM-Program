import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { authenticate, requireUser } from '../middleware/auth.middleware.js';
import { requireVerifiedEmail } from '../middleware/emailVerified.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  dailyDateQuerySchema,
  dailyRangeQuerySchema,
  weeklyQuerySchema,
} from '../schemas/summary.schema.js';
import * as summaryController from '../controllers/summary.controller.js';

const router = Router();

router.use(
  asyncHandler(authenticate),
  asyncHandler(requireVerifiedEmail),
  asyncHandler(requireUser),
);

router.get(
  '/daily',
  validate(dailyDateQuerySchema),
  asyncHandler(summaryController.getDaily),
);
router.get(
  '/daily/range',
  validate(dailyRangeQuerySchema),
  asyncHandler(summaryController.getDailyRange),
);
router.get(
  '/weekly',
  validate(weeklyQuerySchema),
  asyncHandler(summaryController.getWeekly),
);

export default router;
