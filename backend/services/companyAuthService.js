const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const companiesRepo = require("../repositories/companiesRepository");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../mailer");
const AppError = require("../core/AppError");
const mapDbError = require("../core/mapDbError");
const logger = require("../core/logger");
const { JWT_SECRET } = require("../middleware");

function sanitize(c) {
  const { password_hash, verify_token, verify_token_expires, reset_token, reset_token_expires, stripe_customer_id, stripe_subscription_id, ...rest } = c;
  return rest;
}

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

function expiresIn(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function signCompanyToken(company, overrides = {}) {
  return jwt.sign(
    { type: "company", id: company.id, email: company.email, name: company.name, is_registered: company.is_registered, ...overrides },
    JWT_SECRET, { expiresIn: "24h" }
  );
}

async function listPublicCompanies() {
  return companiesRepo.listPublic();
}

async function signup({ name, email, password, tosAccepted }) {
  if (!name || !email || !password)
    throw AppError.badRequest("Name, email and password are required");
  if (password.length < 6)
    throw AppError.badRequest("Password must be at least 6 characters");
  if (!/\S+@\S+\.\S+/.test(email))
    throw AppError.badRequest("Please enter a valid email address");
  if (!tosAccepted)
    throw AppError.badRequest("You must accept the Terms of Service and Privacy Policy");

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await companiesRepo.findByEmail(normalizedEmail);
  if (existing) throw AppError.conflict("An account with this email already exists");

  const passwordHash = bcrypt.hashSync(password, 10);
  const verifyToken = makeToken();
  const verifyExpires = expiresIn(24);

  let company;
  try {
    company = await companiesRepo.create({ name: name.trim(), email: normalizedEmail, passwordHash, verifyToken, verifyExpires });
  } catch (err) {
    // Two near-simultaneous signups with the same email can both pass the
    // pre-check above before either INSERT commits. Postgres' UNIQUE
    // constraint is the real guard against that race — translate its
    // violation into the same friendly conflict error.
    throw mapDbError(err, { duplicateMessage: "An account with this email already exists" });
  }

  try {
    await sendVerificationEmail(company.email, company.name, verifyToken);
  } catch (mailErr) {
    logger.warn("verification_email_failed", { companyId: company.id, error: mailErr.message });
    // Don't block signup on a mail-provider hiccup — the person can resend.
  }

  return {
    token: signCompanyToken(company, { is_registered: 0, email_verified: 0 }),
    company: sanitize(company),
    message: "Account created. Please check your email to verify your account.",
  };
}

async function login({ email, password }) {
  if (!email || !password) throw AppError.badRequest("Email and password are required");

  const company = await companiesRepo.findByEmail(email.toLowerCase().trim());
  if (!company) throw AppError.unauthorized("Invalid email or password");

  const valid = bcrypt.compareSync(password, company.password_hash);
  if (!valid) throw AppError.unauthorized("Invalid email or password");

  if (!company.email_verified) {
    throw new AppError("Please verify your email before signing in.", 403, "EMAIL_NOT_VERIFIED", { email: company.email });
  }

  return { token: signCompanyToken(company), company: sanitize(company) };
}

async function verifyEmail(token) {
  if (!token) throw AppError.badRequest("Verification token is required");

  const company = await companiesRepo.findByVerifyToken(token);
  if (!company) throw AppError.badRequest("Invalid or already used verification link");

  const expired = new Date(company.verify_token_expires) < new Date();
  if (expired) throw AppError.badRequest("Verification link has expired. Please request a new one.", "TOKEN_EXPIRED");

  await companiesRepo.markVerified(company.id);
  const updated = await companiesRepo.findById(company.id);

  return {
    token: signCompanyToken(updated),
    company: sanitize(updated),
    message: "Email verified successfully!",
  };
}

async function resendVerification(email) {
  if (!email) throw AppError.badRequest("Email is required");

  const company = await companiesRepo.findByEmail(email.toLowerCase().trim());
  const genericMessage = { message: "If that email exists and is unverified, a new link has been sent." };

  // Always return the same generic message whether or not the account
  // exists/is already verified — prevents using this endpoint to enumerate
  // registered emails.
  if (!company || company.email_verified) return genericMessage;

  const verifyToken = makeToken();
  const verifyExpires = expiresIn(24);
  await companiesRepo.setVerifyToken(company.id, verifyToken, verifyExpires);
  await sendVerificationEmail(company.email, company.name, verifyToken);

  return { message: "Verification email resent. Please check your inbox." };
}

async function forgotPassword(email) {
  if (!email) throw AppError.badRequest("Email is required");

  const company = await companiesRepo.findByEmail(email.toLowerCase().trim());
  if (!company) throw AppError.notFound("No account found with that email address.");

  const resetToken = makeToken();
  const resetExpires = expiresIn(1);
  await companiesRepo.setResetToken(company.id, resetToken, resetExpires);

  try {
    await sendPasswordResetEmail(company.email, company.name, resetToken);
  } catch (mailErr) {
    logger.error("reset_email_failed", { companyId: company.id, error: mailErr.message });
    throw new AppError("Failed to send reset email. Please check your Gmail settings in .env", 500);
  }

  return { message: "Reset link sent! Please check your inbox." };
}

async function resetPassword({ token, password }) {
  if (!token || !password) throw AppError.badRequest("Token and new password are required");
  if (password.length < 6) throw AppError.badRequest("Password must be at least 6 characters");

  const company = await companiesRepo.findByResetToken(token);
  if (!company) throw AppError.badRequest("Invalid or already used reset link");

  const expired = new Date(company.reset_token_expires) < new Date();
  if (expired) throw AppError.badRequest("Reset link has expired. Please request a new one.");

  const passwordHash = bcrypt.hashSync(password, 10);
  await companiesRepo.resetPassword(company.id, passwordHash);

  return { message: "Password reset successfully. You can now sign in." };
}

async function completeProfile(companyId, { industry, address, logoUrl, contactPerson }) {
  if (!industry || !address || !contactPerson)
    throw AppError.badRequest("Industry, address and contact person are required");

  await companiesRepo.completeProfile(companyId, { industry, address, logoUrl: logoUrl || null, contactPerson });
  const company = await companiesRepo.findById(companyId);

  return { token: signCompanyToken(company, { is_registered: 1 }), company: sanitize(company) };
}

async function getMe(companyId) {
  const company = await companiesRepo.findById(companyId);
  if (!company) throw AppError.notFound("Company not found");
  return { company: sanitize(company) };
}

module.exports = {
  sanitize, listPublicCompanies, signup, login, verifyEmail,
  resendVerification, forgotPassword, resetPassword, completeProfile, getMe,
};
