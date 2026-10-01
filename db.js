'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'sitevaro.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS utenti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS template (
  id TEXT PRIMARY KEY,
  categoria TEXT NOT NULL,
  nome TEXT NOT NULL,
  layout TEXT NOT NULL,
  palette TEXT NOT NULL,
  font TEXT NOT NULL,
  riservato INTEGER NOT NULL DEFAULT 0,
  reserved_by INTEGER REFERENCES utenti(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_template_categoria ON template(categoria);
CREATE INDEX IF NOT EXISTS idx_template_riservato ON template(riservato);

CREATE TABLE IF NOT EXISTS siti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  utente_id INTEGER NOT NULL REFERENCES utenti(id),
  template_id TEXT NOT NULL REFERENCES template(id),
  stripe_subscription_id TEXT,
  stato TEXT NOT NULL DEFAULT 'attivo',
  contenuti_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_siti_slug ON siti(slug);
CREATE INDEX IF NOT EXISTS idx_siti_utente ON siti(utente_id);

CREATE TABLE IF NOT EXISTS abbonamenti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utente_id INTEGER NOT NULL REFERENCES utenti(id),
  stripe_subscription_id TEXT UNIQUE,
  price_id TEXT,
  stato TEXT NOT NULL DEFAULT 'attivo',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_abb_utente ON abbonamenti(utente_id);
`);

module.exports = db;
