'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const templateRoutes = require('./routes/templates');
const checkoutRoutes = require('./routes/checkout');
const webhookRoutes = require('./routes/webhooks');
const { api: sitiApi, pubblico: sitiPubblico } = require('./routes/sites');
const adminRoutes = require('./routes/admin');

// Seed automatico dei template a ogni avvio (idempotente: non duplica,
// non tocca utenti/siti/abbonamenti). Così il deploy funziona anche
// senza eseguire "npm run seed" separatamente.
try {
  const { genera } = require('./lib/seedTemplates');
  const { nuovi, dopo } = genera();
  console.log(`Seed template: ${nuovi} nuovi inseriti (totale ${dopo})`);
} catch (e) {
  console.error('Seed automatico fallito:', e.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Webhook Stripe PRIMA del parser JSON (serve il corpo raw per la firma)
app.use('/api/webhooks/stripe', webhookRoutes);

app.use(express.json({ limit: '1mb' }));

app.get('/api/salute', (req, res) => res.json({ ok: true, servizio: 'sitevaro-backend' }));

// Health check per Render (healthCheckPath in render.yaml)
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/sites', sitiApi);
app.use('/api/admin', adminRoutes);
app.use('/', sitiPubblico); // GET /s/:slug

// 404 JSON per le API
app.use('/api', (req, res) => res.status(404).json({ errore: 'Risorsa non trovata' }));

// Gestore errori generico
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ errore: 'Errore interno del server' });
});

app.listen(PORT, () => {
  console.log(`Sitevaro backend in ascolto su http://localhost:${PORT}`);
  if (!process.env.STRIPE_SECRET_KEY) console.log('⚠️  STRIPE_SECRET_KEY non impostata: i pagamenti restituiranno errore 503 (vedi README).');
  if (!process.env.JWT_SECRET) console.log('⚠️  JWT_SECRET non impostata: auth non funzionerà. Copia .env.example in .env');
});
