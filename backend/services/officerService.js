const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const officersRepo = require("../repositories/officersRepository");
const companiesRepo = require("../repositories/companiesRepository");
const { getPlan } = require("../plans");
const AppError = require("../core/AppError");
const mapDbError = require("../core/mapDbError");
const { JWT_SECRET } = require("../middleware");

async function login({ badgeId, password, companyId }) {
  if (!badgeId || !password || !companyId)
    throw AppError.badRequest("Badge ID, PIN and company are required");

  const officer = await officersRepo.findByBadge(companyId, badgeId.trim().toUpperCase());
  if (!officer) throw AppError.unauthorized("Invalid badge ID or PIN");

  const valid = bcrypt.compareSync(password, officer.password_hash);
  if (!valid) throw AppError.unauthorized("Invalid badge ID or PIN");

  const token = jwt.sign(
    { type: "officer", id: officer.id, badge_id: officer.badge_id, name: officer.name, company_id: officer.company_id },
    JWT_SECRET, { expiresIn: "12h" }
  );

  return { token, officer: { id: officer.id, badge_id: officer.badge_id, name: officer.name, company_id: officer.company_id } };
}

async function list(companyId) {
  return officersRepo.listByCompany(companyId);
}

async function create(companyId, { badgeId, name, pin }) {
  if (!badgeId || !name || !pin)
    throw AppError.badRequest("Badge ID, name and PIN are required");
  if (pin.length < 4)
    throw AppError.badRequest("PIN must be at least 4 digits");

  const planKey = await companiesRepo.getPlanKey(companyId);
  const plan = getPlan(planKey);
  const count = await officersRepo.countByCompany(companyId);
  if (count >= plan.maxOfficers) {
    throw new AppError(
      `Your ${plan.name} plan allows up to ${plan.maxOfficers} officers. Upgrade to add more.`,
      403, "PLAN_LIMIT_OFFICERS"
    );
  }

  const normalizedBadge = badgeId.trim().toUpperCase();
  const existing = await officersRepo.findByBadge(companyId, normalizedBadge);
  if (existing) throw AppError.conflict("Badge ID already exists for this company");

  const passwordHash = bcrypt.hashSync(pin, 10);
  try {
    return await officersRepo.create({ companyId, badgeId: normalizedBadge, name: name.trim(), passwordHash });
  } catch (err) {
    throw mapDbError(err, { duplicateMessage: "Badge ID already exists for this company" });
  }
}

async function remove(companyId, officerId) {
  const officer = await officersRepo.findById(officerId, companyId);
  if (!officer) throw AppError.notFound("Officer not found");

  try {
    await officersRepo.remove(officerId);
  } catch (err) {
    throw mapDbError(err, { fkMessage: "This officer has related records and can't be deleted yet" });
  }
  return { success: true };
}

module.exports = { login, list, create, remove };
