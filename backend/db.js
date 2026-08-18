require("dotenv").config();
const { Pool, types } = require("pg");
const logger = require("./core/logger");

// node-postgres returns BIGINT (used by COUNT(*)) and NUMERIC (used by AVG())
// as strings by default, to avoid silent precision loss on very large values.
// The app code (originally written against sql.js, which always returns plain
// JS numbers) does numeric comparisons and arithmetic on these results, so we
// parse them back into numbers here to match the previous behavior.
types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10))); // int8/bigint
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val))); // numeric

// ─── Connection ──────────────────────────────────────────────────────────────
// Configure via DATABASE_URL (recommended, e.g. postgres://user:pass@host:5432/dbname)
// or via the individual PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE vars that
// node-postgres reads automatically.
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
      }
    : undefined
);

pool.on("error", (err) => {
  logger.error("pg_pool_error", { error: err.message, stack: err.stack });
});

// ─── Compatibility shim ──────────────────────────────────────────────────────
// The rest of the codebase was written against a synchronous, "?"-placeholder
// style API (db.prepare(sql).get(...) / .all(...) / .run(...)), originally
// backed by sql.js. Rather than rewrite every call site, this shim keeps that
// same shape but executes against Postgres, translating "?" placeholders to
// "$1, $2, ..." and auto-appending "RETURNING id" to INSERTs so that
// `result.lastInsertRowid` keeps working. Callers now need to `await` these
// calls since Postgres access is inherently async.

function toPositional(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function isInsert(sql) {
  return /^\s*insert/i.test(sql);
}

function hasReturning(sql) {
  return /returning/i.test(sql);
}

class Statement {
  constructor(sql, queryable = pool) {
    this.sql = sql;
    this.queryable = queryable;
  }

  async run(...params) {
    let sql = toPositional(this.sql);
    const wantsId = isInsert(this.sql) && !hasReturning(this.sql);
    if (wantsId) sql += " RETURNING id";

    const result = await this.queryable.query(sql, params);
    return {
      lastInsertRowid: wantsId ? result.rows[0]?.id ?? null : undefined,
      changes: result.rowCount,
    };
  }

  async get(...params) {
    const sql = toPositional(this.sql);
    const result = await this.queryable.query(sql, params);
    return result.rows[0];
  }

  async all(...params) {
    const sql = toPositional(this.sql);
    const result = await this.queryable.query(sql, params);
    return result.rows;
  }
}

class DB {
  constructor(queryable = pool) {
    this.queryable = queryable;
  }

  prepare(sql) {
    return new Statement(sql, this.queryable);
  }

  async exec(sql) {
    await this.queryable.query(sql);
    return this;
  }
}

let _db = null;
let _ready = null;

async function getDb() {
  if (_db) return _db;
  if (!_ready) _ready = init();
  await _ready;
  return _db;
}

async function init() {
  _db = new DB();

  await _db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      industry TEXT,
      address TEXT,
      logo_url TEXT,
      contact_person TEXT,
      is_registered INTEGER DEFAULT 0,
      email_verified INTEGER DEFAULT 0,
      verify_token TEXT,
      verify_token_expires TIMESTAMP,
      reset_token TEXT,
      reset_token_expires TIMESTAMP,
      tos_accepted_at TIMESTAMP,
      plan TEXT NOT NULL DEFAULT 'free',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      subscription_status TEXT,
      current_period_end TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS officers (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      badge_id TEXT NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(company_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS preregistrations (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      id_number TEXT,
      host TEXT NOT NULL,
      floor TEXT,
      visitor_type TEXT DEFAULT 'work',
      expected_date TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      token TEXT UNIQUE,
      created_by INTEGER REFERENCES officers(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      id_number TEXT NOT NULL,
      phone TEXT,
      host TEXT,
      floor TEXT,
      visitor_type TEXT NOT NULL DEFAULT 'work',
      notes TEXT,
      checked_in_at TIMESTAMP DEFAULT NOW(),
      checked_out_at TIMESTAMP,
      logged_by INTEGER REFERENCES officers(id) ON DELETE SET NULL,
      prereg_id INTEGER REFERENCES preregistrations(id)
    );

    CREATE TABLE IF NOT EXISTS blacklist (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      id_number TEXT,
      first_name TEXT,
      last_name TEXT,
      reason TEXT,
      added_by INTEGER REFERENCES officers(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Indexes: every WHERE/JOIN column that isn't already covered by a
    -- PRIMARY KEY or UNIQUE constraint gets an index so lookups stay fast
    -- as tables grow.
    CREATE INDEX IF NOT EXISTS idx_companies_verify_token ON companies(verify_token);
    CREATE INDEX IF NOT EXISTS idx_companies_reset_token ON companies(reset_token);

    CREATE INDEX IF NOT EXISTS idx_officers_company_id ON officers(company_id);

    CREATE INDEX IF NOT EXISTS idx_preregistrations_company_id ON preregistrations(company_id);
    CREATE INDEX IF NOT EXISTS idx_preregistrations_company_date ON preregistrations(company_id, expected_date);

    CREATE INDEX IF NOT EXISTS idx_visitors_company_id ON visitors(company_id);
    CREATE INDEX IF NOT EXISTS idx_visitors_company_checked_in ON visitors(company_id, checked_in_at);
    CREATE INDEX IF NOT EXISTS idx_visitors_logged_by ON visitors(logged_by);

    CREATE INDEX IF NOT EXISTS idx_blacklist_company_id ON blacklist(company_id);
    CREATE INDEX IF NOT EXISTS idx_blacklist_company_id_number ON blacklist(company_id, id_number);
  `);

  // Migration: adds tos_accepted_at + subscription columns to databases
  // that already had a companies table before these existed. Safe and
  // cheap to run even when the columns are already present.
  await _db.exec(`
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMP;
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status TEXT;
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;

    CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer_id ON companies(stripe_customer_id);
  `);

  // Migration: relax officer foreign keys to ON DELETE SET NULL.
  // Databases created before this change have the default RESTRICT
  // behavior, which makes deleting an officer fail with a foreign key
  // violation the moment that officer has logged a visitor, added a
  // blacklist entry, or created a preregistration — i.e. almost always.
  // Historical records should survive officer deletion with the reference
  // simply nulled out, not block the deletion entirely.
  await _db.exec(`
    ALTER TABLE visitors DROP CONSTRAINT IF EXISTS visitors_logged_by_fkey;
    ALTER TABLE visitors ADD CONSTRAINT visitors_logged_by_fkey
      FOREIGN KEY (logged_by) REFERENCES officers(id) ON DELETE SET NULL;

    ALTER TABLE blacklist DROP CONSTRAINT IF EXISTS blacklist_added_by_fkey;
    ALTER TABLE blacklist ADD CONSTRAINT blacklist_added_by_fkey
      FOREIGN KEY (added_by) REFERENCES officers(id) ON DELETE SET NULL;

    ALTER TABLE preregistrations DROP CONSTRAINT IF EXISTS preregistrations_created_by_fkey;
    ALTER TABLE preregistrations ADD CONSTRAINT preregistrations_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES officers(id) ON DELETE SET NULL;
  `);

  return _db;
}

// Runs `fn` inside a real Postgres transaction: a single checked-out client
// (not the shared pool) executes BEGIN, then every query `fn` makes via the
// `db` handle it receives, then COMMIT — or ROLLBACK if `fn` throws. Use
// this for any operation that must succeed or fail as a whole (e.g. an
// admin deleting a company and everything that belongs to it).
//
//   await withTransaction(async (db) => {
//     await db.prepare("DELETE FROM visitors WHERE company_id = ?").run(id);
//     await db.prepare("DELETE FROM companies WHERE id = ?").run(id);
//   });
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const txDb = new DB(client);
    const result = await fn(txDb);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Simple connectivity check for /api/health — actually hits the DB instead
// of just confirming the process is alive.
async function ping() {
  await pool.query("SELECT 1");
  return true;
}

// Close the pool cleanly on shutdown so deploys/restarts don't leave
// dangling connections open against Postgres.
async function shutdown(signal) {
  logger.info("shutdown_initiated", { signal });
  try {
    await pool.end();
  } catch (err) {
    logger.error("shutdown_error", { error: err.message, stack: err.stack });
  } finally {
    process.exit(0);
  }
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

module.exports = { getDb, pool, ping, withTransaction };
