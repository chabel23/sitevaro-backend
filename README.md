# Sitevaro — Backend

Backend reale della piattaforma SaaS **Sitevaro**: i clienti pagano un abbonamento Stripe
e ottengono un sito pronto in pochi minuti, con template esclusivo riservato solo a loro.

Stack: **Node.js + Express + SQLite (better-sqlite3)**. Pronto da deployare su Railway o Render.

## Funzionalità

- **Auth**: registrazione/login con email + password (bcrypt), JWT, profilo `/api/auth/me`
- **Template**: 600 template (150 per categoria: ristorante, attività locale, freelance/portfolio, e-commerce), generati parametricamente
- **Checkout**: Stripe Checkout in modalità *subscription* con 6 prezzi reali (mensili/annuali)
- **Webhook**: su pagamento riuscito riserva il template (esclusiva cliente), crea il sito e l'abbonamento; su cancellazione sospende il sito
- **Siti**: ogni cliente ha il suo sito pubblico su `/s/:slug`, modificabile via API
- **Admin**: panoramica utenti/abbonamenti/template riservati

## Installazione

```bash
cd sitevaro-backend
npm install
cp .env.example .env
# modifica .env con i tuoi segreti (vedi sotto)
```

## Avvio locale

```bash
# 1. Genera i 600 template (solo la prima volta)
npm run seed

# 2. Avvia il server
npm start
# → http://localhost:3000
```

Modalità sviluppo con riavvio automatico: `npm run dev`

## Chiavi Stripe di TEST (dalla dashboard)

1. Vai su [dashboard.stripe.com](https://dashboard.stripe.com) e accedi (o crea l'account, è gratis).
2. In alto a destra assicurati che sia attiva la **modalità Test** (interruttore "Test mode").
3. Vai su **Sviluppatori → Chiavi API** (*Developers → API keys*).
4. Copia la **chiave segreta** che inizia con `sk_test_...` → incollala in `.env` come `STRIPE_SECRET_KEY`.
5. I 6 prezzi dell'abbonamento esistono già in modalità test (Base €9/mese, Pro €19/mese,
   E-commerce €29/mese + versioni annuali €90/€190/€290). Se vuoi ricrearli:
   **Prodotti → Aggiungi prodotto** con prezzo **ricorrente** (mensile/annuale) in EUR,
   poi aggiorna gli ID nella allowlist `PREZZI` in `src/routes/checkout.js`.

## Testare il checkout (carta 4242…)

Senza `STRIPE_SECRET_KEY`, `POST /api/checkout` risponde `503` con un errore chiaro:
è normale, significa che i pagamenti non sono configurati.

Con la chiave test configurata:

```bash
# Registra un utente e ottieni il token
curl -s -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"cliente@esempio.it","password":"password123"}'

# Scegli un template libero
curl -s 'http://localhost:3000/api/templates?categoria=ristorante' | head -c 300

# Crea il checkout (sostituisci TOKEN, PRICE_ID e TEMPLATE_ID)
curl -s -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer TOKEN" -H 'Content-Type: application/json' \
  -d '{"priceId":"price_1ULk2cHOHbkO5FAonIQgMeug","templateId":"tpl-ristorante-001"}'
# → { "url": "https://checkout.stripe.com/..." }
```

Apri l'URL nel browser e paga con la carta di test **4242 4242 4242 4242**
(qualsiasi data futura, qualsiasi CVC). Stripe reindirizza a `/checkout/successo`
e il webhook crea sito + abbonamento (vedi sotto).

## Configurare il webhook su Stripe

In locale (consigliato, con Stripe CLI):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# copia il segreto whsec_... mostrato → STRIPE_WEBHOOK_SECRET nel .env
```

In produzione, dalla dashboard: **Sviluppatori → Webhook → Aggiungi endpoint**,
URL `https://tuo-dominio/api/webhooks/stripe`, eventi da selezionare:

- `checkout.session.completed`
- `customer.subscription.deleted`

Copia il **segreto di firma** (`whsec_...`) in `STRIPE_WEBHOOK_SECRET`.

## Test del provisioning (senza Stripe)

Simula il webhook e verifica l'intero flusso in locale:

```bash
npm run test-provision
```

Crea un utente di test, simula `checkout.session.completed`, verifica che il template
risulti riservato, che il sito esista e che la cancellazione lo sospenda.

Promuovere un admin:

```bash
node scripts/make-admin.js admin@esempio.it
# poi: GET /api/admin/panoramica con il suo token
```

## API — riepilogo

| Metodo | Rotta | Descrizione |
|---|---|---|
| POST | `/api/auth/register` | Registrazione `{email, password}` → `{utente, token}` |
| POST | `/api/auth/login` | Login → `{utente, token}` |
| GET | `/api/auth/me` | Profilo utente (richiede token) |
| GET | `/api/templates?categoria=` | Template disponibili (solo non riservati) |
| GET | `/api/templates/:id` | Dettaglio template |
| GET | `/api/checkout/piani` | I 6 piani con priceId |
| POST | `/api/checkout` | `{priceId, templateId}` → `{url}` checkout Stripe (richiede token) |
| POST | `/api/webhooks/stripe` | Webhook Stripe (firma verificata) |
| GET | `/s/:slug` | Sito pubblico del cliente |
| GET | `/api/sites/miei` | Siti dell'utente loggato |
| PUT | `/api/sites/:id/contenuti` | Modifica testi/contenuti (solo proprietario) |
| GET | `/api/admin/panoramica` | Statistiche (solo admin) |

Autenticazione: header `Authorization: Bearer <token>`.

## Deploy su Railway

1. Crea un progetto su [railway.app](https://railway.app) → **Deploy from GitHub** (o trascina la cartella).
2. Nelle **Variables** imposta: `JWT_SECRET`, `STRIPE_SECRET_KEY` (live quando pronto),
   `STRIPE_WEBHOOK_SECRET` (live), `BASE_URL=https://tuo-progetto.up.railway.app`.
3. Railway assegna `PORT` automaticamente (il codice la legge da `process.env.PORT`).
4. Dopo il primo deploy, apri una shell nel servizio ed esegui `npm run seed` una volta.
5. Nota: il database SQLite vive nel filesystem del container. Su Railway va bene per
   iniziare; per produzione con più istanze valuta il volume persistente di Railway
   o un Postgres (migrazione semplice: gli accessi al DB sono isolati in `src/db.js`).

## Deploy su Render (passo passo)

> Serve il piano **Starter** (~7$/mese): il disco persistente per il database SQLite
> non esiste nel piano gratuito, e lì i dati (utenti, siti, template riservati)
> andrebbero persi a ogni riavvio. Con lo Starter i dati sono al sicuro.

### 1. Metti il codice su GitHub

1. Vai su [github.com/new](https://github.com/new) e crea un repository (es. `sitevaro-backend`). Non serve README né .gitignore: ci sono già.
2. Sul tuo computer, nella cartella del progetto, esegui questi comandi uno alla volta:

```bash
git init
git add .
git commit -m "Backend Sitevaro pronto per Render"
git branch -M main
git remote add origin https://github.com/TUO-UTENTE/sitevaro-backend.git
git push -u origin main
```

Sostituisci `TUO-UTENTE` con il tuo nome utente GitHub. Se Git chiede login, accedi con il tuo account GitHub.

### 2. Crea il servizio su Render

1. Vai su [dashboard.render.com](https://dashboard.render.com) e accedi (puoi usare "Sign up with GitHub").
2. Clicca **New → Blueprint**.
3. Seleziona il repository `sitevaro-backend` appena creato e clicca **Apply**.
4. Render legge `render.yaml` e ti chiede i valori mancanti — compilali così:
   - `STRIPE_SECRET_KEY`: la chiave segreta di **test** che inizia con `sk_test_...`
     (dashboard Stripe → **Sviluppatori → Chiavi API**, con **Test mode** attivo in alto a destra)
   - `STRIPE_WEBHOOK_SECRET`: lasciala vuota per ora, la imposti al punto 4
   - `BASE_URL`: lasciala vuota per ora, la imposti al punto 3
   - `JWT_SECRET`: già generata in automatico da Render, non toccarla
5. Clicca **Apply** e aspetta che il deploy finisca (qualche minuto). Lo stato diventa **Live**.

### 3. Imposta l'URL pubblico

1. Nella pagina del servizio, copia l'URL che Render ti ha assegnato
   (qualcosa come `https://sitevaro-backend.onrender.com`).
2. Vai su **Environment** (nel menu a sinistra del servizio) e imposta:
   - `BASE_URL` = l'URL appena copiato (senza `/` finale)
3. Salva: Render riavvia il servizio da solo.

### 4. Registra il webhook su Stripe

1. Dashboard Stripe (sempre in **Test mode**) → **Sviluppatori → Webhook → Aggiungi endpoint**.
2. URL endpoint: `https://TUO-URL.onrender.com/api/webhooks/stripe`
   (sostituisci `TUO-URL` con il tuo URL Render).
3. In "Eventi da ascoltare" aggiungi:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Clicca **Aggiungi endpoint**, poi apri il dettaglio e copia il **Segreto di firma**
   (inizia con `whsec_...`).
5. Su Render → **Environment** → imposta `STRIPE_WEBHOOK_SECRET` con quel valore e salva.

### 5. Test end-to-end

1. Apri `https://TUO-URL.onrender.com/api/health` → deve rispondere `{"ok":true}`.
2. Registra un utente: `POST https://TUO-URL.onrender.com/api/auth/register`
   con `{"email":"tua@email.it","password":"una-password-lunga"}`.
3. Crea un checkout (`POST /api/checkout` con token, `priceId` e `templateId`,
   vedi la sezione "Testare il checkout" sopra) e paga con la carta di test
   **4242 4242 4242 4242** (data futura qualsiasi, CVC qualsiasi).
4. Verifica: il template risulta riservato (`GET /api/templates` non lo mostra più)
   e il sito è visibile su `https://TUO-URL.onrender.com/s/:slug`.

### Quando vuoi incassare davvero (go-live)

1. Nella dashboard Stripe disattiva il **Test mode** (passi in modalità live).
2. Ricrea i 6 prezzi in live (**Prodotti → Aggiungi prodotto**, prezzo **ricorrente** EUR)
   e aggiorna gli ID nella allowlist `PREZZI` in `src/routes/checkout.js`.
3. Su Render → **Environment**: sostituisci `STRIPE_SECRET_KEY` con la `sk_live_...`.
4. Registra un **nuovo** webhook live (stesso URL, stessi eventi) e aggiorna
   `STRIPE_WEBHOOK_SECRET` con il nuovo `whsec_...` live.
5. Fai un acquisto di prova con carta reale di piccolo importo, poi rimborsalo
   dalla dashboard Stripe.

## Checklist go-live ✅

- [ ] Chiavi **live** Stripe (`sk_live_...`) in `STRIPE_SECRET_KEY`
- [ ] I 6 prezzi ricreati in **modalità live** nella dashboard, ID aggiornati in `src/routes/checkout.js`
- [ ] Webhook **live** creato nella dashboard con URL di produzione + `STRIPE_WEBHOOK_SECRET` live
- [ ] `BASE_URL` = dominio di produzione (serve per success/cancel URL)
- [ ] `JWT_SECRET` lungo e casuale, diverso da quello di sviluppo
- [ ] Database persistente (volume/disk o Postgres)
- [ ] `npm run seed` eseguito una volta in produzione (600 template)
- [ ] Test end-to-end in live con carta reale di piccolo importo, poi rimborso
- [ ] Pagine legali (privacy, termini) collegate dal frontend

## Struttura

```
sitevaro-backend/
├── src/
│   ├── index.js              # app Express, mount delle route
│   ├── db.js                 # SQLite + schema (utenti, template, siti, abbonamenti)
│   ├── middleware/auth.js    # JWT: richiedeAuth, richiedeAdmin
│   ├── lib/catalog.js        # catalogo parametrico (layout/palette/font)
│   ├── lib/provisioning.js   # crea sito+abbonamento dal webhook (testabile)
│   ├── lib/siteRenderer.js   # HTML del sito cliente
│   └── routes/               # auth, templates, checkout, webhooks, sites, admin
├── scripts/
│   ├── seed.js               # genera i 600 template
│   ├── make-admin.js         # promuove un utente ad admin
│   └── test-provision.js     # test del flusso webhook senza Stripe
└── data/sitevaro.db          # database SQLite (creato al primo avvio)
```
