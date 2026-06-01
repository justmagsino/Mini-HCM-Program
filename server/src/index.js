import app from './app.js';
import { env } from './config/env.js';

const host = env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

const server = app.listen(env.PORT, host, () => {
  console.log(
    `Mini HCM API listening on http://${host}:${env.PORT} (${env.NODE_ENV})`,
  );
});

function shutdown(signal) {
  console.log(`${signal} received, closing server`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
