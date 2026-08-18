const { getDb } = require("../db");

async function findById(id) {
  const db = await getDb();
  return db.prepare("SELECT * FROM companies WHERE id = ?").get(id);
}

async function findByEmail(email) {
  const db = await getDb();
  return db.prepare("SELECT * FROM companies WHERE email = ?").get(email);
}

async function findByVerifyToken(token) {
  const db = await getDb();
  return db.prepare("SELECT * FROM companies WHERE verify_token = ?").get(token);
}

async function findByResetToken(token) {
  const db = await getDb();
  return db.prepare("SELECT * FROM companies WHERE reset_token = ?").get(token);
}

async function listPublic() {
  const db = await getDb();
  return db.prepare(
    "SELECT id, name FROM companies WHERE is_registered = 1 AND email_verified = 1 ORDER BY name ASC"
  ).all();
}

async function create({ name, email, passwordHash, verifyToken, verifyExpires }) {
  const db = await getDb();
  const result = await db.prepare(`
    INSERT INTO companies (name, email, password_hash, is_registered, email_verified, verify_token, verify_token_expires, tos_accepted_at)
    VALUES (?, ?, ?, 0, 0, ?, ?, NOW())
  `).run(name, email, passwordHash, verifyToken, verifyExpires);
  return findById(result.lastInsertRowid);
}

async function markVerified(id) {
  const db = await getDb();
  return db.prepare(
    "UPDATE companies SET email_verified = 1, verify_token = NULL, verify_token_expires = NULL WHERE id = ?"
  ).run(id);
}

async function setVerifyToken(id, verifyToken, verifyExpires) {
  const db = await getDb();
  return db.prepare(
    "UPDATE companies SET verify_token = ?, verify_token_expires = ? WHERE id = ?"
  ).run(verifyToken, verifyExpires, id);
}

async function setResetToken(id, resetToken, resetExpires) {
  const db = await getDb();
  return db.prepare(
    "UPDATE companies SET reset_token = ?, reset_token_expires = ? WHERE id = ?"
  ).run(resetToken, resetExpires, id);
}

async function resetPassword(id, passwordHash) {
  const db = await getDb();
  return db.prepare(
    "UPDATE companies SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?"
  ).run(passwordHash, id);
}

async function completeProfile(id, { industry, address, logoUrl, contactPerson }) {
  const db = await getDb();
  return db.prepare(`
    UPDATE companies SET industry = ?, address = ?, logo_url = ?, contact_person = ?, is_registered = 1 WHERE id = ?
  `).run(industry, address, logoUrl, contactPerson, id);
}

async function getPlanKey(id) {
  const db = await getDb();
  const row = await db.prepare("SELECT plan FROM companies WHERE id = ?").get(id);
  return row?.plan;
}

module.exports = {
  findById, findByEmail, findByVerifyToken, findByResetToken, listPublic,
  create, markVerified, setVerifyToken, setResetToken, resetPassword,
  completeProfile, getPlanKey,
};
