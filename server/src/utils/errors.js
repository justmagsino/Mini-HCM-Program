export class AppError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} code
   * @param {string} message
   */
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * @param {unknown} fn
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
