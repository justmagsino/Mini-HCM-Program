import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/errors.js';
import { authenticate, requireUser } from '../middleware/auth.middleware.js';
import { requireVerifiedEmail } from '../middleware/emailVerified.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  adminDailySummaryQuerySchema,
  adminReportDateQuerySchema,
  adminWeeklyReportQuerySchema,
  exceptionsQuerySchema,
} from '../schemas/summary.schema.js';
import {
  createAttendanceBodySchema,
  dashboardKpisQuerySchema,
  listUsersQuerySchema,
  patchAttendanceBodySchema,
  patchRoleBodySchema,
  patchUserBodySchema,
  searchAttendanceQuerySchema,
  uidParamSchema,
} from '../schemas/admin.schema.js';
import * as reportController from '../controllers/report.controller.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

const adminWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(
  asyncHandler(authenticate),
  asyncHandler(requireVerifiedEmail),
  asyncHandler(requireUser),
  asyncHandler(requireAdmin),
);

router.get(
  '/dashboard/kpis',
  validate(dashboardKpisQuerySchema),
  asyncHandler(adminController.getDashboardKpis),
);
router.get(
  '/dashboard/roster',
  validate(dashboardKpisQuerySchema),
  asyncHandler(adminController.getTodayRoster),
);
router.get(
  '/dashboard/day',
  validate(dashboardKpisQuerySchema),
  asyncHandler(adminController.getDayOverview),
);

router.get('/users', validate(listUsersQuerySchema), asyncHandler(adminController.listUsers));
router.get('/users/:uid', validate(uidParamSchema), asyncHandler(adminController.getUser));
router.patch(
  '/users/:uid',
  validate(patchUserBodySchema),
  adminWriteLimiter,
  asyncHandler(adminController.patchUser),
);
router.patch(
  '/users/:uid/role',
  validate(patchRoleBodySchema),
  adminWriteLimiter,
  asyncHandler(adminController.patchUserRole),
);

router.get(
  '/attendance',
  validate(searchAttendanceQuerySchema),
  asyncHandler(adminController.searchAttendance),
);
router.post(
  '/attendance',
  validate(createAttendanceBodySchema),
  adminWriteLimiter,
  asyncHandler(adminController.createAttendance),
);
router.patch(
  '/attendance/:userId/:date',
  validate(patchAttendanceBodySchema),
  adminWriteLimiter,
  asyncHandler(adminController.patchAttendance),
);

router.get(
  '/summaries/daily',
  validate(adminDailySummaryQuerySchema),
  asyncHandler(reportController.getAdminDailySummary),
);
router.get(
  '/reports/daily',
  validate(adminReportDateQuerySchema),
  asyncHandler(reportController.getTeamDailyReport),
);
router.get(
  '/reports/weekly',
  validate(adminWeeklyReportQuerySchema),
  asyncHandler(reportController.getTeamWeeklyReport),
);
router.get(
  '/reports/exceptions',
  validate(exceptionsQuerySchema),
  asyncHandler(reportController.getExceptionsReport),
);

export default router;
