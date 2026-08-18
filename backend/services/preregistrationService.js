const crypto = require("crypto");
const preregRepo = require("../repositories/preregistrationsRepository");
const companiesRepo = require("../repositories/companiesRepository");
const { sendPreregEmail } = require("../mailer");
const AppError = require("../core/AppError");
const logger = require("../core/logger");

function makeToken() { return crypto.randomBytes(16).toString("hex"); }

async function list(companyId) {
  return preregRepo.listByCompany(companyId);
}

async function create(companyId, officerId, body) {
  const { first_name, last_name, email, phone, id_number, host, floor, visitor_type, expected_date, notes } = body;
  if (!first_name || !last_name || !host || !expected_date)
    throw AppError.badRequest("First name, last name, host and expected date are required");

  const token = makeToken();
  const prereg = await preregRepo.create({
    companyId,
    firstName: first_name.trim(), lastName: last_name.trim(),
    email: email?.trim() || null, phone: phone?.trim() || null, idNumber: id_number?.trim() || null,
    host: host.trim(), floor: floor || null, visitorType: visitor_type || "work",
    expectedDate: expected_date, notes: notes?.trim() || null,
    token, createdBy: officerId,
  });

  if (email) {
    try {
      const company = await companiesRepo.findById(companyId);
      await sendPreregEmail(email, { ...prereg, company_name: company.name });
    } catch (mailErr) {
      logger.warn("prereg_email_failed", { preregId: prereg.id, error: mailErr.message });
    }
  }

  return prereg;
}

async function cancel(companyId, preregId) {
  const prereg = await preregRepo.findById(preregId, companyId);
  if (!prereg) throw AppError.notFound("Not found");
  await preregRepo.cancel(preregId);
  return { success: true };
}

async function today(companyId) {
  const todayDate = new Date().toISOString().slice(0, 10);
  return preregRepo.findPendingForDate(companyId, todayDate);
}

module.exports = { list, create, cancel, today };
