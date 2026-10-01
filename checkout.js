'use strict';

const express = require('express');
const db = require('../db');
const { richiedeAuth } = require('../middleware/auth');

const router = express.Router();

// Allowlist dei prezzi reali (modalità TEST, account CLARIVO)
const PREZZI = {
  'price_1ULk2cHOHbkO5FAonIQgMeug': { piano: 'Base', periodo: 'mese', importo: '€9/mese' },
  'price_1ULk2cHOHbkO5FAoSaCGAKPV': { piano: 'Pro', periodo: 'mese', importo: '€19/mese' },
  'price_1ULk2cHOHbkO5FAo3ofMVXCu': { piano: 'E-commerce', periodo: 'mese', importo: '€29/mese' },
  'price_1ULk2gHOHbkO5FAoFmTAKXnG': { piano: 'Base', periodo: 'anno', importo: '€90/anno' },
  'price_1ULk2gHOHbkO5FAo8BxQ78M9': { piano: 'Pro', periodo: 'anno', importo: '€190/anno' },
  'price_1ULk2gHOHbkO5FAoV3Hs3jHI': { piano: 'E-commerce', periodo: 'anno', importo: '€290/anno' },
};

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return require('stripe')(key);
}

// GET /api/checkout/piani — elenco piani disponibili (pubblico)
router.get('/piani', (req, res) => {
  res.json({ piani: Object.entries(PREZZI).map(([priceId, info]) => ({ priceId, ...info })) });
});

// POST /api/checkout { priceId, templateId } → { url }
router.post('/', richiedeAuth, async (req, res) => {
  const { priceId, templateId } = req.body || {};

  if (!priceId || !PREZZI[priceId]) {
    return res.status(400).json({ errore: 'Piano non valido' });
  }
  if (!templateId) return res.status(400).json({ errore: 'templateId obbligatorio' });

  const template = db.prepare('SELECT id, riservato FROM template WHERE id = ?').get(templateId);
  if (!template) return res.status(404).json({ errore: 'Template non trovato' });
  if (template.riservato) return res.status(409).json({ errore: 'Template già riservato da un altro cliente' });

  const stripe = stripeClient();
  if (!stripe) {
    return res.status(503).json({
      errore: 'Pagamenti non configurati',
      dettaglio: 'STRIPE_SECRET_KEY mancante nel file .env. Vedi README.md per come ottenere le chiavi di test da Stripe.',
    });
  }

  const baseUrl = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: String(req.utente.id), templateId, priceId },
      success_url: `${baseUrl}/checkout/successo?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/annullato`,
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error('Errore Stripe checkout:', e.message);
    res.status(502).json({ errore: 'Errore nella creazione del pagamento', dettaglio: e.message });
  }
});

// Pagine HTML semplici di esito (pubbliche)
router.get('/successo', (req, res) => {
  res.send(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pagamento completato — Sitevaro</title></head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:4rem 1rem">
<h1>🎉 Pagamento completato!</h1><p>Il tuo sito Sitevaro è in preparazione e sarà online tra pochi minuti.</p>
<p>Riceverai il link del tuo sito via email.</p></body></html>`);
});

router.get('/annullato', (req, res) => {
  res.send(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pagamento annullato — Sitevaro</title></head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:4rem 1rem">
<h1>Pagamento annullato</h1><p>Nessun addebito effettuato. Puoi riprovare quando vuoi.</p></body></html>`);
});

module.exports = router;
