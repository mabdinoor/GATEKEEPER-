const winston = require("winston");

// Structured logging replaces ad-hoc console.log/console.error calls.
// In production this emits JSON lines (easy to ship to a log aggregator);
// in development it prints colorized, human-readable lines instead.
const isProd = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "gatekeeper-backend" },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProd ? winston.format.json() : winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, requestId, stack, service, ...meta }) => {
        const ctx = requestId ? ` [${requestId}]` : "";
        const extra = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
        return `${timestamp} ${level}${ctx}: ${message}${extra}${stack ? "\n" + stack : ""}`;
      })
    )
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
