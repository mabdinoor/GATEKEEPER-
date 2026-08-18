const { getDb, withTransaction } = require("../db");

async function listCompaniesWithCounts() {
  const db = await getDb();
  return db.prepare(`
    SELECT
      c.id, c.name, c.email, c.is_registered, c.email_verified, c.plan,
      c.subscription_status, c.current_period_end, c.created_at,
      (SELECT COUNT(*) FROM officers o WHERE o.company_id = c.id) as officer_count,
      (SELECT COUNT(*) FROM visitors v WHERE v.company_id = c.id) as visitor_count,
      (SELECT COUNT(*) FROM blacklist b WHERE b.company_id = c.id) as blacklist_count
    FROM companies c
    ORDER BY c.created_at DESC
  `).all();
}

async function getCompanyById(id) {
  const db = await getDb();
  return db.prepare("SELECT * FROM companies WHERE id = ?").get(id);
}

async function updatePlan(id, planKey) {
  const db = await getDb();
  return db.prepare("UPDATE companies SET plan = ? WHERE id = ?").run(planKey, id);
}

// Deletes a company and every record that belongs to it, as a single
// all-or-nothing transaction. If any step fails, nothing is deleted —
// there's no scenario where a company ends up partially removed.
async function deleteCompanyCascade(id) {
  return withTransaction(async (db) => {
    await db.prepare("DELETE FROM visitors WHERE company_id = ?").run(id);
    await db.prepare("DELETE FROM blacklist WHERE company_id = ?").run(id);
    await db.prepare("DELETE FROM preregistrations WHERE company_id = ?").run(id);
    await db.prepare("DELETE FROM officers WHERE company_id = ?").run(id);
    const result = await db.prepare("DELETE FROM companies WHERE id = ?").run(id);
    return result.changes > 0;
  });
}

async function platformStats() {
  const db = await getDb();
  const [companies, officers, visitorsToday, visitorsTotal, byPlan] = await Promise.all([
    db.prepare("SELECT COUNT(*) as c FROM companies").get(),
    db.prepare("SELECT COUNT(*) as c FROM officers").get(),
    db.prepare("SELECT COUNT(*) as c FROM visitors WHERE DATE(checked_in_at) = CURRENT_DATE").get(),
    db.prepare("SELECT COUNT(*) as c FROM visitors").get(),
    db.prepare("SELECT plan, COUNT(*) as count FROM companies GROUP BY plan").all(),
  ]);

  return {
    totalCompanies: companies.c,
    totalOfficers: officers.c,
    visitorsToday: visitorsToday.c,
    visitorsAllTime: visitorsTotal.c,
    byPlan,
  };
}

module.exports = { listCompaniesWithCounts, getCompanyById, updatePlan, deleteCompanyCascade, platformStats };
