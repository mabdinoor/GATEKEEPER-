const { getDb } = require("../db");

async function listByCompany(companyId) {
  const db = await getDb();
  return db.prepare(`
    SELECT p.*, o.name as created_by_name
    FROM preregistrations p
    LEFT JOIN officers o ON p.created_by = o.id
    WHERE p.company_id = ?
    ORDER BY p.expected_date DESC, p.created_at DESC
  `).all(companyId);
}

async function create({ companyId, firstName, lastName, email, phone, idNumber, host, floor, visitorType, expectedDate, notes, token, createdBy }) {
  const db = await getDb();
  const result = await db.prepare(`
    INSERT INTO preregistrations
      (company_id, first_name, last_name, email, phone, id_number, host, floor, visitor_type, expected_date, notes, token, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(companyId, firstName, lastName, email, phone, idNumber, host, floor, visitorType, expectedDate, notes, token, createdBy);
  return db.prepare("SELECT * FROM preregistrations WHERE id = ?").get(result.lastInsertRowid);
}

async function findById(id, companyId) {
  const db = await getDb();
  return db.prepare("SELECT id FROM preregistrations WHERE id = ? AND company_id = ?").get(id, companyId);
}

async function cancel(id) {
  const db = await getDb();
  return db.prepare("UPDATE preregistrations SET status = 'cancelled' WHERE id = ?").run(id);
}

async function findPendingForDate(companyId, date) {
  const db = await getDb();
  return db.prepare(`
    SELECT * FROM preregistrations
    WHERE company_id = ? AND expected_date = ? AND status = 'pending'
    ORDER BY first_name ASC
  `).all(companyId, date);
}

module.exports = { listByCompany, create, findById, cancel, findPendingForDate };
