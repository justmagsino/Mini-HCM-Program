/**
 * Vercel serverless entry — exports the Express app without calling listen().
 * Deploy with Root Directory = server in the Vercel project settings.
 */
import app from '../src/app.js';

export default app;
