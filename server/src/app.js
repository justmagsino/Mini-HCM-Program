import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import {
  adminReadLimiter,
  apiLimiter,
  authLimiter,
  summariesLimiter,
} from './middleware/rateLimiters.js';

const app = express();

app.disable('x-powered-by');

if (env.NODE_ENV === 'production' && env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      const allowed = env.CORS_ORIGIN;
      if (!origin) {
        callback(null, env.NODE_ENV !== 'production');
        return;
      }
      if (
        env.NODE_ENV === 'development' &&
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(null, allowed.includes(origin));
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/admin', adminReadLimiter);
app.use('/api/summaries', summariesLimiter);
app.use('/api', apiRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

app.use(errorMiddleware);

export default app;
