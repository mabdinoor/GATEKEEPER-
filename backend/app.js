// Express app definition, separated from server.js's "start listening"
// logic. This split exists so tests can import the fully configured app
// and drive it with Supertest, without opening a real network port or
// requiring a live Postgres connection to boot.
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const billing = require("./routes/billing");
const requestContext = require("./core/requestContext");
const { errorHandler, notFoundHandler } = require("./core/errorHandler");
const { ping } = require("./db");

const app = express();
app.use(requestContext);
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));

// Stripe's webhook signature check needs the exact raw request body, so
// this must be mounted BEFORE express.json() below — once JSON parsing
// consumes and reformats the body, signature verification would fail.
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), billing.webhookHandler);

app.use(express.json({ limit: "5mb" }));

// Login/signup endpoints are the most attractive brute-force / enumeration
// targets, so they get a tighter rate limit than the rest of the API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/companies/login", authLimiter);
app.use("/api/companies/signup", authLimiter);
app.use("/api/companies/forgot-password", authLimiter);
app.use("/api/companies/reset-password", authLimiter);
app.use("/api/admin/login", authLimiter);

app.use("/api/companies",  require("./routes/companies"));
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/visitors",   require("./routes/visitors"));
app.use("/api/blacklist",  require("./routes/blacklist"));
app.use("/api/prereg",     require("./routes/preregistrations"));
app.use("/api/analytics",  require("./routes/analytics"));
app.use("/api/billing",    billing.router);
app.use("/api/admin",      require("./routes/admin"));

// Actually checks the DB connection instead of just confirming the process
// is alive — a dead Postgres connection should show up as unhealthy here.
app.get("/api/health", async (_, res) => {
  try {
    await ping();
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", db: "unreachable", error: err.message });
  }
});

// Must be mounted after all routes: notFoundHandler turns unmatched routes
// into a proper 404, and errorHandler is the single place every thrown/
// forwarded error in the app gets logged and formatted into a response.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
