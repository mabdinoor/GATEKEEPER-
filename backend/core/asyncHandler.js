// Wraps an async controller function so any thrown error (or rejected
// promise) is passed to next(err), reaching the centralized error handler
// in core/errorHandler.js — instead of every controller needing its own
// try/catch just to forward errors.
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
