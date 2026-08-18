const AppError = require("./AppError");

// Translates raw Postgres error codes into AppErrors with a message that's
// safe to show the user. Anything not recognized here is returned
// unchanged, so the centralized error handler treats it as an unexpected
// 500 and hides the raw DB message from the client.
function mapDbError(err, context = {}) {
  switch (err.code) {
    case "23505": // unique_violation
      return AppError.conflict(context.duplicateMessage || "A record with this value already exists", "DUPLICATE");
    case "23503": // foreign_key_violation
      return AppError.conflict(context.fkMessage || "This action conflicts with related records", "FK_CONSTRAINT");
    default:
      return err;
  }
}

module.exports = mapDbError;
