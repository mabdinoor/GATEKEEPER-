const { getDb } = require("../db");

async function findByIdNumber(companyId, idNumber) {
  const db = await getDb();
  return db.prepare("SELECT * FROM blacklist WHERE company_id = ? AND id_number = ?").get(companyId, idNumber);
}

async function listByCompany(companyId) {
  const db = await getDb();
  return db.prepare(`
    SELECT b.*, o.name as added_by_name
    FROM blacklist b
    LEFT JOIN officers o ON b.added_by = o.id
    WHERE b.company_id = ?
    ORDER BY b.created_at DESC
  `).all(companyId);
}

async function create({ companyId, idNumber, firstName, lastName, reason, addedBy }) {
  const db = await getDb();
  const result = await db.prepare(`
    INSERT INTO blacklist (company_id, id_number, first_name, last_name, reason, added_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(companyId, idNumber, firstName, lastName, reason, addedBy);
  return db.prepare("SELECT * FROM blacklist WHERE id = ?").get(result.lastInsertRowid);
}

async function findById(id, companyId) {
  const db = await getDb();
  return db.prepare("SELECT id FROM blacklist WHERE id = ? AND company_id = ?").get(id, companyId);
}

async function remove(id) {
  const db = await getDb();
  return db.prepare("DELETE FROM blacklist WHERE id = ?").run(id);
}

module.exports = { findByIdNumber, listByCompany, create, findById, remove };
