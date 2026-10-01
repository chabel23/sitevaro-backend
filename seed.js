'use strict';

/**
 * Seed parametrico via CLI: 150 template per categoria × 4 categorie = 600 template.
 * Idempotente: sicuro da eseguire più volte.
 *
 * Uso: node scripts/seed.js  oppure  npm run seed
 *
 * Nota: il server esegue questo seed automaticamente a ogni avvio
 * (vedi src/index.js), quindi in produzione su Render non serve lanciarlo a mano.
 */

const db = require('../src/db');
const { genera } = require('../src/lib/seedTemplates');

const { nuovi, dopo, riepilogo, conteggio } = genera();
console.log(`Seed completato: ${nuovi} nuovi template inseriti, ${dopo - nuovi} già presenti (totale: ${dopo})`);
for (const [cat, n] of Object.entries(riepilogo)) console.log(`  - ${cat}: ${n} previsti`);
console.log('Verifica DB:', JSON.stringify(conteggio));
const esempio = db.prepare("SELECT id, nome, riservato FROM template WHERE id = 'tpl-ristorante-042'").get();
console.log('Esempio:', JSON.stringify(esempio));
console.log('Nota: utenti, siti e abbonamenti non sono stati toccati.');
