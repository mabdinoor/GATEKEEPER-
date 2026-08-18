const logger = require("./logger");
const AppError = require("./AppError");

// Mounted last in server.js, after all routes. Any error passed to next(err)
// anywhere in the app — thrown in a controller, a service, or bubbled up by
// asyncHandler — ends up here exactly once, instead of each route
// formatting (and sometimes forgetting to format) its own error response.
function errorHandler(err, req, res, next) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;

  logger[isAppError && statusCode < 500 ? "warn" : "error"]("request_error", {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code: err.code,
    message: err.message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    error: isAppError ? err.message : "Server error",
    ...(isAppError && err.code ? { code: err.code } : {}),
    ...(isAppError && err.details ? { details: err.details } : {}),
    requestId: req.id,
  });
}

// Mounted after all routes but before errorHandler — turns any unmatched
// route into a proper 404 AppError instead of Express's default plain-text
// "Cannot GET /whatever".
function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND"));
}

module.exports = { errorHandler, notFoundHandler };
