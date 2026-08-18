const { getDb } = require("../db");

async function search({ companyId, search, type, status, date }) {
  const db = await getDb();
  let query = `
    SELECT v.*, o.name as officer_name
    FROM visitors v
    LEFT JOIN officers o ON v.logged_by = o.id
    WHERE v.company_id = ?
  `;
  const params = [companyId];

  if (search) {
    query += ` AND (v.first_name ILIKE ? OR v.last_name ILIKE ? OR v.id_number ILIKE ? OR v.host ILIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (type && type !== "all") { query += ` AND v.visitor_type = ?`; params.push(type); }
  if (status === "in")  query += ` AND v.checked_out_at IS NULL`;
  if (status === "out") query += ` AND v.checked_out_at IS NOT NULL`;
  if (date) { query += ` AND DATE(v.checked_in_at) = DATE(?)`; params.push(date); }

  query += ` ORDER BY v.checked_in_at DESC LIMIT 200`;
  return db.prepare(query).all(...params);
}

async function countThisMonth(companyId) {
  const db = await getDb();
  const row = await db.prepare(`
    SELECT COUNT(*) as count FROM visitors
    WHERE company_id = ? AND checked_in_at >= date_trunc('month', CURRENT_DATE)
  `).get(companyId);
  return row.count;
}

async function findById(id, companyId) {
  const db = await getDb();
  return db.prepare("SELECT * FROM visitors WHERE id = ? AND company_id = ?").get(id, companyId);
}

async function checkIn({ companyId, firstName, lastName, idNumber, phone, host, floor, visitorType, notes, loggedBy }) {
  const db = await getDb();
  const result = await db.prepare(`
    INSERT INTO visitors (company_id, first_name, last_name, id_number, phone, host, floor, visitor_type, notes, logged_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(companyId, firstName, lastName, idNumber, phone, host, floor, visitorType, notes, loggedBy);

  if (!result.lastInsertRowid) return null;
  return db.prepare("SELECT * FROM visitors WHERE id = ?").get(result.lastInsertRowid);
}

async function checkOut(id) {
  const db = await getDb();
  await db.prepare("UPDATE visitors SET checked_out_at = NOW() WHERE id = ?").run(id);
  return db.prepare("SELECT * FROM visitors WHERE id = ?").get(id);
}

// --- Reporting queries used by the /stats and analytics endpoints ---

async function countForDate(companyId, date, { checkedOut } = {}) {
  const db = await getDb();
  let query = "SELECT COUNT(*) as c FROM visitors WHERE company_id = ? AND DATE(checked_in_at) = DATE(?)";
  if (checkedOut === true) query += " AND checked_out_at IS NOT NULL";
  if (checkedOut === false) query += " AND checked_out_at IS NULL";
  const row = await db.prepare(query).get(companyId, date);
  return row?.c ?? 0;
}

async function byTypeForDate(companyId, date) {
  const db = await getDb();
  return db.prepare(
    `SELECT visitor_type, COUNT(*) as count FROM visitors WHERE company_id = ? AND DATE(checked_in_at) = DATE(?) GROUP BY visitor_type`
  ).all(companyId, date);
}

async function byHourForDate(companyId, date) {
  const db = await getDb();
  return db.prepare(
    `SELECT EXTRACT(HOUR FROM checked_in_at)::INTEGER as hour, COUNT(*) as count FROM visitors WHERE company_id = ? AND DATE(checked_in_at) = DATE(?) GROUP BY hour ORDER BY hour`
  ).all(companyId, date);
}

async function last7Days(companyId) {
  const db = await getDb();
  return db.prepare(
    `SELECT DATE(checked_in_at) as date, COUNT(*) as count FROM visitors WHERE company_id = ? AND checked_in_at >= CURRENT_DATE - INTERVAL '6 days' GROUP BY DATE(checked_in_at) ORDER BY date ASC`
  ).all(companyId);
}

async function byFloorForDate(companyId, date) {
  const db = await getDb();
  return db.prepare(
    `SELECT floor, COUNT(*) as count FROM visitors WHERE company_id = ? AND DATE(checked_in_at) = DATE(?) AND floor IS NOT NULL AND floor != '' GROUP BY floor ORDER BY count DESC LIMIT 5`
  ).all(companyId, date);
}

async function recent(companyId, limit = 8) {
  const db = await getDb();
  return db.prepare(
    `SELECT v.first_name, v.last_name, v.visitor_type, v.checked_in_at, v.checked_out_at, o.name as officer_name FROM visitors v LEFT JOIN officers o ON v.logged_by = o.id WHERE v.company_id = ? ORDER BY v.checked_in_at DESC LIMIT ?`
  ).all(companyId, limit);
}

async function avgDurationMinsForDate(companyId, date) {
  const db = await getDb();
  const row = await db.prepare(
    `SELECT AVG(EXTRACT(EPOCH FROM (checked_out_at - checked_in_at)) / 60) as avg_mins FROM visitors WHERE company_id = ? AND DATE(checked_in_at) = DATE(?) AND checked_out_at IS NOT NULL`
  ).get(companyId, date);
  return row?.avg_mins || 0;
}

// --- Date-range queries used by the analytics report/email endpoints ---
// (same shape as the "today" queries above, but >= a given start date
// instead of = a single day)

async function countSince(companyId, since, { checkedOut } = {}) {
  const db = await getDb();
  let query = "SELECT COUNT(*) as c FROM visitors WHERE company_id = ? AND DATE(checked_in_at) >= DATE(?)";
  if (checkedOut === true) query += " AND checked_out_at IS NOT NULL";
  const row = await db.prepare(query).get(companyId, since);
  return row?.c ?? 0;
}

async function byTypeSince(companyId, since) {
  const db = await getDb();
  return db.prepare(
    "SELECT visitor_type, COUNT(*) as count FROM visitors WHERE company_id = ? AND DATE(checked_in_at) >= DATE(?) GROUP BY visitor_type"
  ).all(companyId, since);
}

async function byDaySince(companyId, since) {
  const db = await getDb();
  return db.prepare(
    "SELECT DATE(checked_in_at) as date, COUNT(*) as count FROM visitors WHERE company_id = ? AND DATE(checked_in_at) >= DATE(?) GROUP BY DATE(checked_in_at) ORDER BY date ASC"
  ).all(companyId, since);
}

async function topFloorsSince(companyId, since) {
  const db = await getDb();
  return db.prepare(
    "SELECT floor, COUNT(*) as count FROM visitors WHERE company_id = ? AND DATE(checked_in_at) >= DATE(?) AND floor IS NOT NULL AND floor != '' GROUP BY floor ORDER BY count DESC LIMIT 5"
  ).all(companyId, since);
}

async function avgDurationMinsSince(companyId, since) {
  const db = await getDb();
  const row = await db.prepare(
    "SELECT AVG(EXTRACT(EPOCH FROM (checked_out_at - checked_in_at)) / 60) as avg_mins FROM visitors WHERE company_id = ? AND DATE(checked_in_at) >= DATE(?) AND checked_out_at IS NOT NULL"
  ).get(companyId, since);
  return row?.avg_mins || 0;
}

module.exports = {
  search, countThisMonth, findById, checkIn, checkOut,
  countForDate, byTypeForDate, byHourForDate, last7Days, byFloorForDate, recent, avgDurationMinsForDate,
  countSince, byTypeSince, byDaySince, topFloorsSince, avgDurationMinsSince,
};
