'use strict';

const express = require('express');
const db = require('../db');
const { richiedeAuth } = require('../middleware/auth');
const { renderSito } = require('../lib/siteRenderer');

const api = express.Router();      // montato su /api/sites
const pubblico = express.Router(); // montato su / (GET /s/:slug)

function sitoConTemplate(id) {
  return db.prepare(`
    SELECT s.*, t.categoria, t.nome AS template_nome, t.layout, t.palette, t.font
    FROM siti s JOIN template t ON t.id = s.template_id
    WHERE s.id = ?
  `).get(id);
}

function serializzaSito(sito) {
  return {
    id: sito.id,
    slug: sito.slug,
    stato: sito.stato,
    template_id: sito.template_id,
    template_nome: sito.template_nome,
    categoria: sito.categoria,
    url: `/s/${sito.slug}`,
    contenuti: JSON.parse(sito.contenuti_json || '{}'),
    created_at: sito.created_at,
  };
}

// GET /api/sites/miei — siti dell'utente loggato
api.get('/miei', richiedeAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, t.categoria, t.nome AS template_nome
    FROM siti s JOIN template t ON t.id = s.template_id
    WHERE s.utente_id = ? ORDER BY s.created_at DESC
  `).all(req.utente.id);
  res.json({ siti: rows.map(serializzaSito) });
});

// PUT /api/sites/:id/contenuti — solo il proprietario; merge dei campi inviati
api.put('/:id/contenuti', richiedeAuth, (req, res) => {
  const sito = db.prepare('SELECT * FROM siti WHERE id = ?').get(req.params.id);
  if (!sito) return res.status(404).json({ errore: 'Sito non trovato' });
  if (sito.utente_id !== req.utente.id) return res.status(403).json({ errore: 'Non sei il proprietario di questo sito' });

  const nuovi = req.body && typeof req.body === 'object' ? req.body : {};
  const attuali = JSON.parse(sito.contenuti_json || '{}');
  const aggiornati = { ...attuali, ...nuovi };
  db.prepare('UPDATE siti SET contenuti_json = ? WHERE id = ?').run(JSON.stringify(aggiornati), sito.id);
  res.json({ sito: serializzaSito(sitoConTemplate(sito.id)) });
});

// GET /s/:slug — sito pubblico del cliente
pubblico.get('/s/:slug', (req, res) => {
  const sito = db.prepare(`
    SELECT s.*, t.categoria, t.nome AS template_nome, t.layout, t.palette, t.font
    FROM siti s JOIN template t ON t.id = s.template_id
    WHERE s.slug = ?
  `).get(req.params.slug);
  if (!sito) return res.status(404).send('<h1>Sito non trovato</h1>');
  if (sito.stato !== 'attivo') {
    return res.status(410).send('<h1>Sito temporaneamente sospeso</h1><p>Abbonamento non attivo.</p>');
  }
  res.send(renderSito({ sito, template: sito, contenuti: JSON.parse(sito.contenuti_json || '{}') }));
});

module.exports = { api, pubblico };
