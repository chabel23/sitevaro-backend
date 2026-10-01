'use strict';

const express = require('express');
const { handleCheckoutCompleted, handleSubscriptionDeleted } = require('../lib/provisioning');

const router = express.Router();

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return require('stripe')(key);
}

// POST /api/webhooks/stripe — corpo RAW (necessario per verificare la firma)
router.post('/', express.raw({ type: 'application/json' }), (req, res) => {
  const stripe = stripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.error('Webhook Stripe ricevuto ma chiavi non configurate');
    return res.status(503).json({ errore: 'Webhook non configurato (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET mancanti)' });
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (e) {
    console.error('Firma webhook non valida:', e.message);
    return res.status(400).json({ errore: 'Firma webhook non valida' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const sito = handleCheckoutCompleted(event.data.object);
      console.log(`Provisioning completato: sito #${sito.id} (slug: ${sito.slug})`);
    } else if (event.type === 'customer.subscription.deleted') {
      handleSubscriptionDeleted(event.data.object);
      console.log(`Abbonamento ${event.data.object.id} cancellato: sito sospeso`);
    } else {
      console.log(`Webhook ignorato: ${event.type}`);
    }
    res.json({ ricevuto: true });
  } catch (e) {
    console.error('Errore gestione webhook:', e.message);
    res.status(500).json({ errore: e.message });
  }
});

module.exports = router;
