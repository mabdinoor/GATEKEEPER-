const blacklistRepo = require("../repositories/blacklistRepository");
const AppError = require("../core/AppError");

// ID numbers are unique; names are not — matching by name alone risks both
// false positives (two "John Doe"s) and false negatives (a typo'd name).
// ID number is the only reliable key for blacklist matching, so that's the
// only thing checked here now.
async function check(companyId, { id_number }) {
  if (!id_number) return { blocked: false, entry: null };

  const match = await blacklistRepo.findByIdNumber(companyId, id_number.trim());
  return { blocked: !!match, entry: match || null };
}

async function list(companyId) {
  return blacklistRepo.listByCompany(companyId);
}

async function create(companyId, officerId, { id_number, first_name, last_name, reason }) {
  if (!id_number) throw AppError.badRequest("An ID number is required to add someone to the blacklist");

  const existing = await blacklistRepo.findByIdNumber(companyId, id_number.trim());
  if (existing) throw AppError.conflict("This ID is already on the blacklist");

  return blacklistRepo.create({
    companyId,
    idNumber: id_number.trim(),
    firstName: first_name?.trim() || null,
    lastName: last_name?.trim() || null,
    reason: reason?.trim() || null,
    addedBy: officerId,
  });
}

async function remove(companyId, entryId) {
  const entry = await blacklistRepo.findById(entryId, companyId);
  if (!entry) throw AppError.notFound("Entry not found");
  await blacklistRepo.remove(entryId);
  return { success: true };
}

module.exports = { check, list, create, remove };
