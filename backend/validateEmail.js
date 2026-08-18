const dns = require("dns").promises;
const logger = require("./core/logger");

/**
 * Validates an email address:
 * 1. Basic format check
 * 2. MX record lookup — confirms the domain can actually receive email
 */
async function validateEmail(email) {
  // 1. Format check
  if (!email || typeof email !== "string") return { valid: false, reason: "Email is required" };

  const trimmed = email.trim().toLowerCase();
  const formatOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
  if (!formatOk) return { valid: false, reason: "Please enter a valid email address" };

  const domain = trimmed.split("@")[1];

  // 2. MX record check
  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      return { valid: false, reason: `The domain "${domain}" cannot receive emails` };
    }
    return { valid: true };
  } catch (err) {
    // ENOTFOUND = domain doesn't exist; ENODATA = no MX records
    if (err.code === "ENOTFOUND" || err.code === "ENODATA" || err.code === "ESERVFAIL") {
      return { valid: false, reason: `The email domain "${domain}" does not exist or cannot receive email` };
    }
    // Network error or DNS timeout — don't block signup, just warn and allow
    logger.warn("dns_mx_lookup_failed", { code: err.code, domain });
    return { valid: true };
  }
}

module.exports = { validateEmail };
