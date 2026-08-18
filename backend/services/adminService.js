const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const adminRepo = require("../repositories/adminRepository");
const officersRepo = require("../repositories/officersRepository");
const visitorsRepo = require("../repositories/visitorsRepository");
const blacklistRepo = require("../repositories/blacklistRepository");
const preregRepo = require("../repositories/preregistrationsRepository");
const { getPlan, PLANS } = require("../plans");
const AppError = require("../core/AppError");
const logger = require("../core/logger");
const { JWT_SECRET } = require("../middleware");

// Constant-time string comparison — a plain `===` leaks timing information
// proportional to how many leading characters match, which is a real (if
// niche) attack against the single hardcoded admin credential this checks.
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function login({ username, password }) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    logger.warn("admin_login_not_configured", { message: "ADMIN_USERNAME/ADMIN_PASSWORD not set in .env" });
    throw new AppError("Admin login is not configured on this server", 503);
  }
  if (!username || !password) throw AppError.badRequest("Username and password are required");

  const validUser = safeEqual(username, expectedUser);
  const validPass = safeEqual(password, expectedPass);
  if (!validUser || !validPass) throw AppError.unauthorized("Invalid admin credentials");

  const token = jwt.sign({ type: "admin", username }, JWT_SECRET, { expiresIn: "8h" });
  return { token };
}

async function listCompanies() {
  const companies = await adminRepo.listCompaniesWithCounts();
  return companies.map((c) => ({ ...c, planInfo: getPlan(c.plan) }));
}

async function getCompanyDetail(companyId) {
  const company = await adminRepo.getCompanyById(companyId);
  if (!company) throw AppError.notFound("Company not found");

  const [officers, visitors, blacklist, preregistrations] = await Promise.all([
    officersRepo.listByCompany(companyId),
    visitorsRepo.search({ companyId }),
    blacklistRepo.listByCompany(companyId),
    preregRepo.listByCompany(companyId),
  ]);

  const { password_hash, verify_token, reset_token, stripe_customer_id, stripe_subscription_id, ...safeCompany } = company;

  return {
    company: { ...safeCompany, planInfo: getPlan(company.plan) },
    officers,
    visitors: visitors.slice(0, 50), // most recent 50 — the full log has its own paginated view
    blacklist,
    preregistrations,
  };
}

async function changePlan(companyId, planKey) {
  if (!PLANS[planKey]) throw AppError.badRequest("Unknown plan: " + planKey);
  const company = await adminRepo.getCompanyById(companyId);
  if (!company) throw AppError.notFound("Company not found");

  await adminRepo.updatePlan(companyId, planKey);
  logger.info("admin_plan_override", { companyId, from: company.plan, to: planKey });
  return { success: true, plan: getPlan(planKey) };
}

async function deleteCompany(companyId) {
  const company = await adminRepo.getCompanyById(companyId);
  if (!company) throw AppError.notFound("Company not found");

  const deleted = await adminRepo.deleteCompanyCascade(companyId);
  logger.warn("admin_company_deleted", { companyId, name: company.name, email: company.email });
  return { success: deleted };
}

async function getPlatformStats() {
  return adminRepo.platformStats();
}

module.exports = { login, listCompanies, getCompanyDetail, changePlan, deleteCompany, getPlatformStats };
