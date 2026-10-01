'use strict';

const express = require('express');
const db = require('../db');
const { richiedeAuth, richiedeAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/panoramica — solo admin
router.get('/panoramica', richiedeAuth, richiedeAdmin, (req, res) => {
  const conta = (sql, params = []) => db.prepare(sql).get(...params);
  res.json({
    utenti: conta('SELECT COUNT(*) AS c FROM utenti').c,
    abbonamenti_attivi: conta("SELECT COUNT(*) AS c FROM abbonamenti WHERE stato = 'attivo'").c,
    abbonamenti_totali: conta('SELECT COUNT(*) AS c FROM abbonamenti').c,
    template_totali: conta('SELECT COUNT(*) AS c FROM template').c,
    template_riservati: conta('SELECT COUNT(*) AS c FROM template WHERE riservato = 1').c,
    siti_totali: conta('SELECT COUNT(*) AS c FROM siti').c,
    siti_attivi: conta("SELECT COUNT(*) AS c FROM siti WHERE stato = 'attivo'").c,
    siti_sospesi: conta("SELECT COUNT(*) AS c FROM siti WHERE stato = 'sospeso'").c,
  });
});

module.exports = router;
