const { randomUUID } = require("crypto");
const logger = require("./logger");

// Assigns every request a unique ID (or reuses one from an upstream proxy),
// exposes it on req.id for use in logs and error responses, and logs a
// structured line once the response finishes.
function requestContext(req, res, next) {
  req.id = req.headers["x-request-id"] || randomUUID();
  res.setHeader("X-Request-Id", req.id);

  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info("http_request", {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
    });
  });

  next();
}

module.exports = requestContext;
