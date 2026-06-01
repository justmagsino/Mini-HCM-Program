import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { authenticate, requireUser } from '../middleware/auth.middleware.js';
import { requireVerifiedEmail } from '../middleware/emailVerified.middleware.js';
import { registerLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.middleware.js';
import { patchProfileBodySchema, registerBodySchema } from '../schemas/auth.schema.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post(
  '/register',
  registerLimiter,
  asyncHandler(authenticate),
  asyncHandler(requireVerifiedEmail),
  validate(registerBodySchema),
  asyncHandler(authController.register),
);

router.get(
  '/me',
  asyncHandler(authenticate),
  asyncHandler(requireVerifiedEmail),
  asyncHandler(requireUser),
  asyncHandler(authController.getMe),
);

router.patch(
  '/me',
  asyncHandler(authenticate),
  asyncHandler(requireVerifiedEmail),
  asyncHandler(requireUser),
  validate(patchProfileBodySchema),
  asyncHandler(authController.patchMe),
);

router.post('/logout', asyncHandler(authenticate), asyncHandler(authController.logout));

export default router;
