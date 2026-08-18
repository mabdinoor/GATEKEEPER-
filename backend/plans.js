// Plan definitions — single source of truth for pricing display, limit
// enforcement, and mapping Stripe price IDs back to a plan key on webhooks.
//
// These prices/limits are placeholders — adjust freely. Nothing else in the
// codebase needs to change if you tweak numbers here, except the actual
// Stripe Price objects (see backend/.env.example for how those connect).
const PLANS = {
  free: {
    key: "free",
    name: "Free",
    price: 0,
    priceLabel: "$0",
    interval: null,
    maxOfficers: 2,
    maxVisitorsPerMonth: 100,
    stripePriceEnvVar: null, // free plan has no Stripe price — no checkout needed
    features: [
      "Up to 2 security officers",
      "Up to 100 visitor check-ins / month",
      "Visitor log & blacklist",
      "Basic analytics",
    ],
  },
  pro: {
    key: "pro",
    name: "Pro",
    price: 29,
    priceLabel: "$29",
    interval: "month",
    maxOfficers: 10,
    maxVisitorsPerMonth: Infinity,
    stripePriceEnvVar: "STRIPE_PRICE_ID_PRO",
    features: [
      "Up to 10 security officers",
      "Unlimited visitor check-ins",
      "Full analytics & reporting",
      "Preregistration & email invites",
      "Email support",
    ],
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    price: 99,
    priceLabel: "$99",
    interval: "month",
    maxOfficers: Infinity,
    maxVisitorsPerMonth: Infinity,
    stripePriceEnvVar: "STRIPE_PRICE_ID_ENTERPRISE",
    features: [
      "Unlimited security officers",
      "Unlimited visitor check-ins",
      "Full analytics & reporting",
      "Priority support",
      "Custom onboarding",
    ],
  },
};

function getPlan(key) {
  return PLANS[key] || PLANS.free;
}

// Maps a Stripe Price ID (from a webhook event) back to a plan key, so we
// know which plan to store on the company row when a subscription changes.
function planKeyForStripePrice(priceId) {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceEnvVar && process.env[plan.stripePriceEnvVar] === priceId) {
      return plan.key;
    }
  }
  return null;
}

// Public-safe view of plans for the pricing page — omits the env var name.
function publicPlans() {
  return Object.values(PLANS).map(({ stripePriceEnvVar, ...rest }) => rest);
}

module.exports = { PLANS, getPlan, planKeyForStripePrice, publicPlans };
