/**
 * Errors thrown by the pure computation engine (mapped to AppError in services).
 */
export class ComputationError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'ComputationError';
    this.code = code;
  }
}
