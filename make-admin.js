'use strict';

/**
 * Promuove un utente ad amministratore.
 * Uso: node scripts/make-admin.js utente@esempio.it
 */
require('dotenv').config();
const db = require('../src/db');

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Uso: node scripts/make-admin.js utente@esempio.it');
  process.exit(1);
}
const utente = db.prepare('SELECT id, email, is_admin FROM utenti WHERE email = ?').get(email);
if (!utente) {
  console.error(`Utente ${email} non trovato. Registralo prima con POST /api/auth/register`);
  process.exit(1);
}
db.prepare('UPDATE utenti SET is_admin = 1 WHERE id = ?').run(utente.id);
console.log(`OK: ${email} ora è amministratore`);
