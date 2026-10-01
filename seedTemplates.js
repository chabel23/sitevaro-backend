'use strict';

/**
 * Seed parametrico IDEMPOTENTE: 150 template per categoria × 4 categorie = 600 template.
 * 10 layout base × 15 palette/variazioni per categoria.
 *
 * Sicuro da eseguire più volte (anche a ogni avvio del server):
 * - usa INSERT OR IGNORE: i template esistenti NON vengono duplicati né sovrascritti
 *   (quindi un template già riservato resta riservato)
 * - non cancella né modifica MAI utenti, siti o abbonamenti
 *
 * Usato sia da scripts/seed.js (CLI) sia automaticamente all'avvio del server.
 */

const db = require('../db');
const { CATEGORIE, NOMI_CATEGORIE, LAYOUTS, PALETTES, FONTS, NOMI_VETRINA } = require('./catalog');

function genera() {
  const inserisci = db.prepare(`
    INSERT OR IGNORE INTO template (id, categoria, nome, layout, palette, font, riservato)
    VALUES (@id, @categoria, @nome, @layout, @palette, @font, 0)
  `);

  const prima = db.prepare('SELECT COUNT(*) AS c FROM template').get().c;
  let nuovi = 0;
  const riepilogo = {};

  const tx = db.transaction(() => {
    for (const categoria of CATEGORIE) {
      const layouts = LAYOUTS[categoria];
      const vetrine = NOMI_VETRINA[categoria];
      let n = 0;
      for (let li = 0; li < layouts.length; li++) {
        for (let pi = 0; pi < PALETTES.length; pi++) {
          n += 1;
          const numero = String(n).padStart(3, '0');
          const id = `tpl-${categoria}-${numero}`;
          const nomeVetrina = vetrine[(li + pi) % vetrine.length];
          const nome = `${NOMI_CATEGORIE[categoria]} · ${nomeVetrina} ${numero}`;
          const font = FONTS[(li * PALETTES.length + pi) % FONTS.length];
          const res = inserisci.run({
            id,
            categoria,
            nome,
            layout: layouts[li],
            palette: JSON.stringify(PALETTES[pi]),
            font,
          });
          nuovi += res.changes; // 1 se inserito, 0 se esisteva già (IGNORE)
        }
      }
      riepilogo[categoria] = n;
    }
  });

  tx();

  const dopo = db.prepare('SELECT COUNT(*) AS c FROM template').get().c;
  const conteggio = db.prepare('SELECT categoria, COUNT(*) AS c FROM template GROUP BY categoria').all();
  return { prima, nuovi, dopo, riepilogo, conteggio };
}

module.exports = { genera };
