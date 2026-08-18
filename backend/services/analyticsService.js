const visitorsRepo = require("../repositories/visitorsRepository");
const companiesRepo = require("../repositories/companiesRepository");
const { sendAnalyticsReport } = require("../mailer");
const AppError = require("../core/AppError");

function sinceDateFor(period) {
  const days = period === "monthly" ? 30 : 7;
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  return { days, since };
}

// Builds the full report payload for a given company + period. Used by both
// GET /report (preview in the dashboard) and POST /send (emails the same
// data) — previously these two routes duplicated every query.
async function buildReport(companyId, period) {
  const { days, since } = sinceDateFor(period);

  const [total, checkedOut, byType, byDay, topFloors, avgMins] = await Promise.all([
    visitorsRepo.countSince(companyId, since),
    visitorsRepo.countSince(companyId, since, { checkedOut: true }),
    visitorsRepo.byTypeSince(companyId, since),
    visitorsRepo.byDaySince(companyId, since),
    visitorsRepo.topFloorsSince(companyId, since),
    visitorsRepo.avgDurationMinsSince(companyId, since),
  ]);

  const busiestDay = byDay.length > 0 ? byDay.reduce((a, b) => (a.count > b.count ? a : b)) : null;

  return {
    period, days, since, total, checkedOut, byType, byDay, topFloors,
    avgDurationMins: Math.round(avgMins || 0),
    busiestDay,
  };
}

async function getReport(companyId, period = "weekly") {
  return buildReport(companyId, period);
}

async function sendReport(companyId, period = "weekly") {
  const company = await companiesRepo.findById(companyId);
  if (!company) throw AppError.notFound("Company not found");

  const report = await buildReport(companyId, period);
  await sendAnalyticsReport(company.email, company.name, report);

  return { message: `${period === "monthly" ? "Monthly" : "Weekly"} report sent to ${company.email}` };
}

module.exports = { getReport, sendReport };
