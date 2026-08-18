const visitorsRepo = require("../repositories/visitorsRepository");
const companiesRepo = require("../repositories/companiesRepository");
const { getPlan } = require("../plans");
const AppError = require("../core/AppError");

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

async function search(companyId, { search, type, status, date }) {
  return visitorsRepo.search({ companyId, search, type, status, date });
}

async function checkIn(companyId, officerId, body) {
  const { first_name, last_name, id_number, phone, host, floor, visitor_type, notes } = body;
  if (!first_name || !last_name || !id_number)
    throw AppError.badRequest("First name, last name and ID are required");

  const planKey = await companiesRepo.getPlanKey(companyId);
  const plan = getPlan(planKey);
  if (Number.isFinite(plan.maxVisitorsPerMonth)) {
    const count = await visitorsRepo.countThisMonth(companyId);
    if (count >= plan.maxVisitorsPerMonth) {
      throw new AppError(
        `Your ${plan.name} plan allows up to ${plan.maxVisitorsPerMonth} check-ins per month. Upgrade for unlimited check-ins.`,
        403, "PLAN_LIMIT_VISITORS"
      );
    }
  }

  const visitor = await visitorsRepo.checkIn({
    companyId,
    firstName: first_name.trim(), lastName: last_name.trim(), idNumber: id_number.trim(),
    phone: phone || null, host: host || null, floor: floor || null,
    visitorType: visitor_type || "work", notes: notes || null,
    loggedBy: officerId,
  });

  if (!visitor) throw new AppError("Failed to save visitor", 500);
  return visitor;
}

async function checkOut(companyId, visitorId) {
  const visitor = await visitorsRepo.findById(visitorId, companyId);
  if (!visitor) throw AppError.notFound("Visitor not found");
  if (visitor.checked_out_at) throw AppError.badRequest("Visitor already checked out");

  return visitorsRepo.checkOut(visitorId);
}

async function getStats(companyId) {
  const today = todayISODate();

  const [total, inside, checkedOut, byType, byHour, last7Days, byFloor, recent, avgMins] = await Promise.all([
    visitorsRepo.countForDate(companyId, today),
    visitorsRepo.countForDate(companyId, today, { checkedOut: false }),
    visitorsRepo.countForDate(companyId, today, { checkedOut: true }),
    visitorsRepo.byTypeForDate(companyId, today),
    visitorsRepo.byHourForDate(companyId, today),
    visitorsRepo.last7Days(companyId),
    visitorsRepo.byFloorForDate(companyId, today),
    visitorsRepo.recent(companyId, 8),
    visitorsRepo.avgDurationMinsForDate(companyId, today),
  ]);

  return {
    today: { total, inside, checkedOut },
    byType, byHour, last7Days, byFloor, recent,
    avgDurationMins: Math.round(avgMins || 0),
  };
}

module.exports = { search, checkIn, checkOut, getStats };
