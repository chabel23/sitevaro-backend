'use strict';

const express = require('express');
const db = require('../db');
const { CATEGORIE } = require('../lib/catalog');

const router = express.Router();

function serializza(row) {
  if (!row) return null;
  return {
    id: row.id,
    categoria: row.categoria,
    nome: row.nome,
    layout: row.layout,
    palette: JSON.parse(row.palette),
    font: row.font,
    riservato: !!row.riservato,
  };
}

// GET /api/templates?categoria=ristorante — solo template NON riservati
router.get('/', (req, res) => {
  const { categoria } = req.query;
  let rows;
  if (categoria) {
    if (!CATEGORIE.includes(categoria)) {
      return res.status(400).json({ errore: `Categoria non valida. Valori ammessi: ${CATEGORIE.join(', ')}` });
    }
    rows = db.prepare('SELECT * FROM template WHERE categoria = ? AND riservato = 0 ORDER BY id').all(categoria);
  } else {
    rows = db.prepare('SELECT * FROM template WHERE riservato = 0 ORDER BY categoria, id').all();
  }
  res.json({ totale: rows.length, template: rows.map(serializza) });
});

// GET /api/templates/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM template WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ errore: 'Template non trovato' });
  res.json({ template: serializza(row) });
});

module.exports = router;
