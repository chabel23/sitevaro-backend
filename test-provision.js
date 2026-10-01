'use strict';

/**
 * Simula il webhook Stripe chiamando la logica di provisioning direttamente.
 * Uso: node scripts/test-provision.js
 * Verifica: template riservato, sito creato, abbonamento creato, idempotenza,
 * sospensione su cancellazione abbonamento.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/db');
const { handleCheckoutCompleted, handleSubscriptionDeleted } = require('../src/lib/provisioning');

const EMAIL = 'test-provision@sitevaro.local';

function assert(cond, messaggio) {
  if (!cond) { console.error('❌ FAIL:', messaggio); process.exit(1); }
  console.log('✅', messaggio);
}

// Pulizia dati di test precedenti
const vecchio = db.prepare('SELECT id FROM utenti WHERE email = ?').get(EMAIL);
if (vecchio) {
  db.prepare('UPDATE template SET riservato = 0, reserved_by = NULL WHERE reserved_by = ?').run(vecchio.id);
  db.prepare('DELETE FROM siti WHERE utente_id = ?').run(vecchio.id);
  db.prepare('DELETE FROM abbonamenti WHERE utente_id = ?').run(vecchio.id);
  db.prepare('DELETE FROM utenti WHERE id = ?').run(vecchio.id);
}

// 1. Creo utente di test
const hash = bcrypt.hashSync('password123', 10);
const u = db.prepare('INSERT INTO utenti (email, password_hash) VALUES (?, ?)').run(EMAIL, hash);
const userId = u.lastInsertRowid;
assert(userId > 0, `utente di test creato (id=${userId})`);

// 2. Scelgo un template libero
const template = db.prepare("SELECT * FROM template WHERE categoria = 'ristorante' AND riservato = 0 LIMIT 1").get();
assert(template, `template libero trovato: ${template.id} (${template.nome})`);

// 3. Simulo checkout.session.completed
const fakeSession = {
  id: 'cs_test_123',
  customer: 'cus_test_123',
  subscription: 'sub_test_123',
  metadata: { userId: String(userId), templateId: template.id, priceId: 'price_1ULk2cHOHbkO5FAonIQgMeug' },
};
const sito = handleCheckoutCompleted(fakeSession);
assert(sito && sito.slug, `sito creato con slug: ${sito.slug}`);
assert(sito.stato === 'attivo', 'sito in stato attivo');

// 4. Verifiche DB
const t = db.prepare('SELECT riservato, reserved_by FROM template WHERE id = ?').get(template.id);
assert(t.riservato === 1 && t.reserved_by === userId, 'template marcato come riservato al cliente');
const abb = db.prepare('SELECT * FROM abbonamenti WHERE stripe_subscription_id = ?').get('sub_test_123');
assert(abb && abb.stato === 'attivo', 'abbonamento creato e attivo');
assert(abb.price_id === 'price_1ULk2cHOHbkO5FAonIQgMeug', 'price_id salvato correttamente');

// 5. Il template riservato non deve più apparire tra i disponibili
const ancoraLibero = db.prepare('SELECT id FROM template WHERE id = ? AND riservato = 0').get(template.id);
assert(!ancoraLibero, 'template riservato escluso dai disponibili');

// 6. Idempotenza: secondo webhook uguale non duplica
const sito2 = handleCheckoutCompleted(fakeSession);
assert(sito2.id === sito.id, 'webhook duplicato: nessun sito duplicato (idempotente)');
const nSiti = db.prepare('SELECT COUNT(*) AS c FROM siti WHERE stripe_subscription_id = ?').get('sub_test_123').c;
assert(nSiti === 1, 'un solo sito per subscription');

// 7. Simulo customer.subscription.deleted
handleSubscriptionDeleted({ id: 'sub_test_123' });
const sospeso = db.prepare('SELECT stato FROM siti WHERE id = ?').get(sito.id);
assert(sospeso.stato === 'sospeso', 'sito sospeso dopo cancellazione abbonamento');
const abbCanc = db.prepare('SELECT stato FROM abbonamenti WHERE stripe_subscription_id = ?').get('sub_test_123');
assert(abbCanc.stato === 'cancellato', 'abbonamento marcato come cancellato');

console.log('\nTutti i test di provisioning passati ✔');
console.log(`Sito di test: /s/${sito.slug} (ora sospeso, come da cancellazione simulata)`);
