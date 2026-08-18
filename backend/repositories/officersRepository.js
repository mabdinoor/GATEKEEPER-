const { getDb } = require("../db");

async function listByCompany(companyId) {
  const db = await getDb();
  return db.prepare(
    "SELECT id, badge_id, name, created_at FROM officers WHERE company_id = ? ORDER BY created_at DESC"
  ).all(companyId);
}

async function countByCompany(companyId) {
  const db = await getDb();
  const row = await db.prepare("SELECT COUNT(*) as count FROM officers WHERE company_id = ?").get(companyId);
  return row.count;
}

async function findByBadge(companyId, badgeId) {
  const db = await getDb();
  return db.prepare(
    "SELECT * FROM officers WHERE company_id = ? AND badge_id = ?"
  ).get(companyId, badgeId);
}

async function findById(id, companyId) {
  const db = await getDb();
  return db.prepare(
    "SELECT id, badge_id, name, created_at FROM officers WHERE id = ? AND company_id = ?"
  ).get(id, companyId);
}

async function create({ companyId, badgeId, name, passwordHash }) {
  const db = await getDb();
  const result = await db.prepare(
    "INSERT INTO officers (company_id, badge_id, name, password_hash) VALUES (?, ?, ?, ?)"
  ).run(companyId, badgeId, name, passwordHash);
  return db.prepare(
    "SELECT id, badge_id, name, created_at FROM officers WHERE id = ?"
  ).get(result.lastInsertRowid);
}

async function remove(id) {
  const db = await getDb();
  return db.prepare("DELETE FROM officers WHERE id = ?").run(id);
}

module.exports = { listByCompany, countByCompany, findByBadge, findById, create, remove };
