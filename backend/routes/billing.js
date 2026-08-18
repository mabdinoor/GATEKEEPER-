const router = require("express").Router();
const { getDb } = require("../db");
const { companyAuthMiddleware } = require("../middleware");
const { stripe } = require("../stripe");
const { getPlan, publicPlans, planKeyForStripePrice } = require("../plans");
const logger = require("../core/logger");

function requireStripe(res) {
  if (!stripe) {
    res.status(503).json({ error: "Billing is not configured on this server yet" });
    return false;
  }
  return true;
}

// GET /api/billing/plans — public, used by the pricing page
router.get("/plans", (req, res) => {
  res.json({ plans: publicPlans() });
});

// GET /api/billing/status — current company's plan + subscription state
router.get("/status", companyAuthMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const company = await db.prepare(
      "SELECT plan, subscription_status, current_period_end FROM companies WHERE id = ?"
    ).get(req.company.id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    res.json({
      plan: getPlan(company.plan),
      subscriptionStatus: company.subscription_status,
      currentPeriodEnd: company.current_period_end,
    });
  } catch (err) {
    logger.error("billing_status_error", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/billing/checkout — body: { plan: "pro" | "enterprise" }
// Creates a Stripe Checkout session and returns its URL for the frontend
// to redirect to. The actual plan upgrade happens later, via the webhook,
// once Stripe confirms the subscription was created — never trust the
// client-side redirect alone to grant access.
router.post("/checkout", companyAuthMiddleware, async (req, res) => {
  if (!requireStripe(res)) return;
  try {
    const { plan: planKey } = req.body;
    const plan = getPlan(planKey);
    if (!plan.stripePriceEnvVar) {
      return res.status(400).json({ error: "That plan doesn't require checkout" });
    }
    const priceId = process.env[plan.stripePriceEnvVar];
    if (!priceId) {
      return res.status(503).json({ error: `${plan.stripePriceEnvVar} is not configured on this server` });
    }

    const db = await getDb();
    const company = await db.prepare("SELECT id, email, name, stripe_customer_id FROM companies WHERE id = ?").get(req.company.id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    // Reuse an existing Stripe customer if we already created one for this
    // company (e.g. they downgraded to free and are now upgrading again).
    let customerId = company.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.email,
        name: company.name,
        metadata: { companyId: String(company.id) },
      });
      customerId = customer.id;
      await db.prepare("UPDATE companies SET stripe_customer_id = ? WHERE id = ?").run(customerId, company.id);
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/company/dashboard?checkout=success`,
      cancel_url: `${frontendUrl}/pricing?checkout=cancelled`,
      metadata: { companyId: String(company.id), plan: plan.key },
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error("checkout_session_error", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "Could not start checkout" });
  }
});

// POST /api/billing/portal — Stripe's hosted billing management page
// (update card, view invoices, cancel subscription, etc.)
router.post("/portal", companyAuthMiddleware, async (req, res) => {
  if (!requireStripe(res)) return;
  try {
    const db = await getDb();
    const company = await db.prepare("SELECT stripe_customer_id FROM companies WHERE id = ?").get(req.company.id);
    if (!company?.stripe_customer_id) {
      return res.status(400).json({ error: "No billing account yet — choose a paid plan first" });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${frontendUrl}/company/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error("portal_session_error", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "Could not open billing portal" });
  }
});

// Stripe calls this directly, not the frontend. Exported separately (not
// attached to `router`) because it must be mounted in server.js with
// express.raw() BEFORE the global express.json() parser — Stripe's
// signature verification needs the exact raw request body, which JSON
// parsing would otherwise consume and reformat first.
async function webhookHandler(req, res) {
  if (!stripe) return res.status(503).send("Billing not configured");

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Only acceptable in local dev when you haven't set up a webhook
      // secret yet (e.g. testing with the Stripe CLI without --print-secret
      // wired in). In production, STRIPE_WEBHOOK_SECRET must be set, or
      // anyone could POST fake events to this endpoint.
      logger.warn("webhook_secret_missing", { message: "STRIPE_WEBHOOK_SECRET not set — accepting webhook without signature verification (dev only!)" });
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    logger.error("webhook_signature_invalid", { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const db = await getDb();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const companyId = session.metadata?.companyId;
        if (companyId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const priceId = subscription.items.data[0]?.price?.id;
          const planKey = planKeyForStripePrice(priceId) || session.metadata?.plan || "pro";
          await db.prepare(`
            UPDATE companies
            SET plan = ?, stripe_subscription_id = ?, subscription_status = ?,
                current_period_end = to_timestamp(?)
            WHERE id = ?
          `).run(planKey, subscription.id, subscription.status, subscription.current_period_end, companyId);
        }
        break;
      }

      // Covers renewals, upgrades/downgrades, cancellations-at-period-end,
      // and payment failures — Stripe sends this whenever the subscription
      // object changes, which is the source of truth for status/plan.
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object;
        const priceId = subscription.items.data[0]?.price?.id;
        const planKey = planKeyForStripePrice(priceId);
        const company = await db.prepare("SELECT id FROM companies WHERE stripe_customer_id = ?").get(subscription.customer);
        if (company) {
          await db.prepare(`
            UPDATE companies
            SET plan = COALESCE(?, plan), stripe_subscription_id = ?, subscription_status = ?,
                current_period_end = to_timestamp(?)
            WHERE id = ?
          `).run(planKey, subscription.id, subscription.status, subscription.current_period_end, company.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const company = await db.prepare("SELECT id FROM companies WHERE stripe_customer_id = ?").get(subscription.customer);
        if (company) {
          await db.prepare(`
            UPDATE companies
            SET plan = 'free', subscription_status = 'canceled', current_period_end = NULL
            WHERE id = ?
          `).run(company.id);
        }
        break;
      }

      default:
        // Unhandled event types are fine to ignore — Stripe sends many
        // more than we act on.
        break;
    }

    res.json({ received: true });
  } catch (err) {
    logger.error("webhook_handler_error", { error: err.message, stack: err.stack });
    // Return 200 anyway so Stripe doesn't retry-storm on a bug in our own
    // handler; the error is logged above for investigation.
    res.json({ received: true, error: "handler_error" });
  }
}

module.exports = { router, webhookHandler };
