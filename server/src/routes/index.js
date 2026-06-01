import { Router } from 'express';
import authRoutes from './auth.routes.js';
import attendanceRoutes from './attendance.routes.js';
import summaryRoutes from './summary.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/summaries', summaryRoutes);
router.use('/admin', adminRoutes);

export default router;
