// Thrown by the service layer for expected, "the request was bad/blocked"
// situations (validation failures, not-found, conflicts, plan limits).
// The centralized error handler treats these as safe to show to the user
// (err.message is returned as-is). Anything else thrown (a genuine bug,
// an unexpected DB error) is NOT an AppError, so the handler hides its
// message from the client and logs the full stack instead.
class AppError extends Error {
  constructor(message, statusCode = 500, code = undefined, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code, details) { return new AppError(message, 400, code, details); }
  static unauthorized(message = "Unauthorized", code) { return new AppError(message, 401, code); }
  static forbidden(message = "Forbidden", code) { return new AppError(message, 403, code); }
  static notFound(message = "Not found", code) { return new AppError(message, 404, code); }
  static conflict(message, code) { return new AppError(message, 409, code); }
}

module.exports = AppError;
