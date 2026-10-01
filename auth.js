'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { firmaToken, richiedeAuth } = require('../middleware/auth');

const router = express.Router();

function emailValida(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// POST /api/auth/register { email, password }
router.post('/register', (req, res) => {
  const { email, password } = req.body || {};
  if (!emailValida(email)) return res.status(400).json({ errore: 'Email non valida' });
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ errore: 'La password deve avere almeno 8 caratteri' });
  }
  const emailNorm = email.trim().toLowerCase();
  const esiste = db.prepare('SELECT id FROM utenti WHERE email = ?').get(emailNorm);
  if (esiste) return res.status(409).json({ errore: 'Email già registrata' });

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO utenti (email, password_hash) VALUES (?, ?)').run(emailNorm, password_hash);
  const utente = db.prepare('SELECT id, email, is_admin, created_at FROM utenti WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ utente, token: firmaToken(utente) });
});

// POST /api/auth/login { email, password }
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!emailValida(email) || typeof password !== 'string') {
    return res.status(400).json({ errore: 'Email e password sono obbligatorie' });
  }
  const row = db.prepare('SELECT * FROM utenti WHERE email = ?').get(email.trim().toLowerCase());
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ errore: 'Credenziali non valide' });
  }
  const utente = { id: row.id, email: row.email, is_admin: !!row.is_admin, created_at: row.created_at };
  res.json({ utente, token: firmaToken(utente) });
});

// GET /api/auth/me
router.get('/me', richiedeAuth, (req, res) => {
  res.json({ utente: req.utente });
});

module.exports = router;
