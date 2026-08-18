// Stripe client — https://stripe.com/docs/api
//
// Get test-mode keys at https://dashboard.stripe.com/test/apikeys
// Set STRIPE_SECRET_KEY in backend/.env before using any billing route.
// Billing routes return a clear error (not a crash) if it's missing, so
// local development without Stripe configured yet doesn't break the rest
// of the app.
let stripe = null;
const logger = require("./core/logger");

if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
} else {
  logger.warn("stripe_not_configured", {
    message: "STRIPE_SECRET_KEY is not set — billing/subscription routes are disabled. Set it in backend/.env to enable checkout and billing management.",
  });
}

module.exports = { stripe };
