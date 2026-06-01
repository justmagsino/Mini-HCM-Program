import { z } from 'zod';

const clientEnvSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1, 'VITE_FIREBASE_API_KEY is required'),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'VITE_FIREBASE_AUTH_DOMAIN is required'),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1, 'VITE_FIREBASE_PROJECT_ID is required'),
  VITE_API_BASE_URL: z.string().url('VITE_API_BASE_URL must be a valid URL'),
});

/**
 * Validated Vite environment variables (Firebase public config + API URL).
 * @returns {z.infer<typeof clientEnvSchema>}
 */
export function getClientEnv() {
  return clientEnvSchema.parse(import.meta.env);
}
