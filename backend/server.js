const app = require("./app");
const { getDb } = require("./db");
const logger = require("./core/logger");

const PORT = process.env.PORT || 4000;
getDb().then(() => {
  app.listen(PORT, () => logger.info(`GateKeeper API listening on http://localhost:${PORT}`));
}).catch(err => {
  logger.error("db_init_failed", { error: err.message, stack: err.stack });
  process.exit(1);
});

// Surface anything that slips past asyncHandler (shouldn't happen, but a
// synchronous throw in non-async middleware or a stray unhandled rejection
// would otherwise crash the process silently).
process.on("unhandledRejection", (reason) => {
  logger.error("unhandled_rejection", { reason: reason?.message || reason, stack: reason?.stack });
});
