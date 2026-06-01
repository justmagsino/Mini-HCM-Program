import { AppError } from '../utils/errors.js';

/**
 * @param {import('zod').ZodSchema} schema
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join('; ');
      return next(new AppError(400, 'VALIDATION_ERROR', message));
    }

    req.validated = result.data;
    return next();
  };
}
