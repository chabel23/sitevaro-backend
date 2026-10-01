'use strict';

/**
 * Provisioning: crea sito + abbonamento dopo un pagamento riuscito,
 * sospende il sito se l'abbonamento viene cancellato.
 * Usata da src/routes/webhooks.js e da scripts/test-provision.js.
 */

const crypto = require('crypto');
const db = require('../db');

function slugify(testo) {
  return (testo || 'sito')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'sito';
}

function generaSlug(base) {
  for (let i = 0; i < 10; i++) {
    const slug = `${slugify(base)}-${crypto.randomBytes(3).toString('hex')}`;
    const esiste = db.prepare('SELECT id FROM siti WHERE slug = ?').get(slug);
    if (!esiste) return slug;
  }
  return `sito-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

function contenutiDefault(categoria) {
  const base = {
    nome_attivita: 'La mia attività',
    tagline: 'Il tuo sito pronto in minuti con Sitevaro',
    descrizione: 'Benvenuto nel nostro sito! Personalizza questi testi dal tuo pannello.',
    telefono: '+39 000 000 0000',
    email: 'info@esempio.it',
    indirizzo: 'Via Esempio 1, Milano',
  };
  if (categoria === 'ristorante') {
    return { ...base, orari: 'Lun–Dom 12:00–23:00', piatti: [
      { nome: 'Piatto della casa', prezzo: '€14', descrizione: 'La nostra specialità, ingredienti freschi di stagione.' },
      { nome: 'Antipasto misto', prezzo: '€9', descrizione: 'Selezione di antipasti della tradizione.' },
      { nome: 'Dolce del giorno', prezzo: '€6', descrizione: 'Chiedi al nostro staff il dolce di oggi.' },
    ]};
  }
  if (categoria === 'attivita-locale') {
    return { ...base, orari: 'Lun–Ven 9:00–19:00', servizi: [
      { nome: 'Servizio 1', descrizione: 'Descrizione del primo servizio offerto.' },
      { nome: 'Servizio 2', descrizione: 'Descrizione del secondo servizio offerto.' },
      { nome: 'Servizio 3', descrizione: 'Descrizione del terzo servizio offerto.' },
    ]};
  }
  if (categoria === 'freelance-portfolio') {
    return { ...base, nome_attivita: 'Mario Rossi', ruolo: 'Freelance Designer', bio: 'Creo esperienze digitali memorabili da oltre 5 anni.', progetti: [
      { titolo: 'Progetto Alpha', descrizione: 'Restyling completo di un brand locale.' },
      { titolo: 'Progetto Beta', descrizione: 'Sito vetrina per uno studio professionale.' },
      { titolo: 'Progetto Gamma', descrizione: 'Identità visiva per una startup.' },
    ]};
  }
  // e-commerce
  return { ...base, nome_attivita: 'Il mio negozio', prodotti: [
    { nome: 'Prodotto 1', prezzo: '€29', descrizione: 'Descrizione del prodotto in vendita.' },
    { nome: 'Prodotto 2', prezzo: '€49', descrizione: 'Descrizione del prodotto in vendita.' },
    { nome: 'Prodotto 3', prezzo: '€19', descrizione: 'Descrizione del prodotto in vendita.' },
  ]};
}

/**
 * Gestisce checkout.session.completed.
 * session = { metadata: { userId, templateId, priceId? }, subscription, customer }
 * Ritorna il sito creato. Idempotente: se esiste già un sito con la stessa
 * stripe_subscription_id, lo restituisce senza duplicare.
 */
function handleCheckoutCompleted(session) {
  const metadata = session.metadata || {};
  const userId = Number(metadata.userId);
  const templateId = metadata.templateId;
  const subscriptionId = session.subscription || null;

  if (!userId || !templateId) throw new Error('Metadata userId/templateId mancanti nella sessione');

  const utente = db.prepare('SELECT id FROM utenti WHERE id = ?').get(userId);
  if (!utente) throw new Error(`Utente ${userId} non trovato`);

  if (subscriptionId) {
    const gia = db.prepare('SELECT * FROM siti WHERE stripe_subscription_id = ?').get(subscriptionId);
    if (gia) return gia; // webhook ricevuto due volte: niente duplicati
  }

  const template = db.prepare('SELECT * FROM template WHERE id = ?').get(templateId);
  if (!template) throw new Error(`Template ${templateId} non trovato`);
  if (template.riservato) throw new Error(`Template ${templateId} già riservato da un altro cliente`);

  const priceId = metadata.priceId || null;
  const slug = generaSlug(contenutiDefault(template.categoria).nome_attivita);

  const tx = db.transaction(() => {
    db.prepare('UPDATE template SET riservato = 1, reserved_by = ? WHERE id = ?').run(userId, templateId);
    const info = db.prepare(`
      INSERT INTO siti (slug, utente_id, template_id, stripe_subscription_id, stato, contenuti_json)
      VALUES (?, ?, ?, ?, 'attivo', ?)
    `).run(slug, userId, templateId, subscriptionId, JSON.stringify(contenutiDefault(template.categoria)));
    db.prepare(`
      INSERT INTO abbonamenti (utente_id, stripe_subscription_id, price_id, stato)
      VALUES (?, ?, ?, 'attivo')
      ON CONFLICT(stripe_subscription_id) DO UPDATE SET stato = 'attivo', price_id = excluded.price_id
    `).run(userId, subscriptionId, priceId);
    return db.prepare('SELECT * FROM siti WHERE id = ?').get(info.lastInsertRowid);
  });

  return tx();
}

/**
 * Gestisce customer.subscription.deleted: sospende sito e abbonamento.
 * subscription = { id }
 */
function handleSubscriptionDeleted(subscription) {
  const subscriptionId = subscription.id;
  const tx = db.transaction(() => {
    db.prepare("UPDATE siti SET stato = 'sospeso' WHERE stripe_subscription_id = ?").run(subscriptionId);
    db.prepare("UPDATE abbonamenti SET stato = 'cancellato' WHERE stripe_subscription_id = ?").run(subscriptionId);
  });
  tx();
  return db.prepare('SELECT * FROM siti WHERE stripe_subscription_id = ?').get(subscriptionId) || null;
}

module.exports = { handleCheckoutCompleted, handleSubscriptionDeleted, contenutiDefault, generaSlug };
