import 'dotenv/config';
import { z } from 'zod';

const serverEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  /** Comma-separated allowed browser origins (e.g. Hosting URL + preview channels). */
  CORS_ORIGIN: z
    .string()
    .min(1, 'CORS_ORIGIN is required')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .refine(
      (origins) => origins.every((origin) => {
        try {
          const url = new URL(origin);
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
          return false;
        }
      }),
      { message: 'CORS_ORIGIN must be valid http(s) origin URLs' },
    ),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z.string().email('FIREBASE_CLIENT_EMAIL must be a valid email'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),
  DEFAULT_TIMEZONE: z.string().min(1).default('Asia/Manila'),
  DEFAULT_SHIFT_START: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'DEFAULT_SHIFT_START must be HH:mm')
    .default('09:00'),
  DEFAULT_SHIFT_END: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'DEFAULT_SHIFT_END must be HH:mm')
    .default('18:00'),
  ALLOW_PUBLIC_REGISTER: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  LATE_ALERT_MINUTES: z.coerce.number().int().nonnegative().default(15),
  UNDERTIME_ALERT_MINUTES: z.coerce.number().int().nonnegative().default(30),
});

/**
 * Validated server environment variables.
 * Import this module before Firebase Admin initialization.
 */
const parsed = serverEnvSchema.parse(process.env);

if (parsed.NODE_ENV === 'production') {
  const invalidCors = parsed.CORS_ORIGIN.filter((origin) => !origin.startsWith('https://'));
  if (invalidCors.length > 0) {
    throw new Error(
      `CORS_ORIGIN must use HTTPS in production. Invalid: ${invalidCors.join(', ')}`,
    );
  }
}

export const env = parsed;

/**
 * Service account private key with escaped newlines normalized.
 * @returns {string}
 */
export function getFirebasePrivateKey() {
  return env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
}
