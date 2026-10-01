'use strict';

/**
 * Catalogo parametrico dei template Sitevaro.
 * 10 layout base × 15 palette/variazioni = 150 template unici per categoria.
 * Usato da scripts/seed.js (generazione) e src/lib/siteRenderer.js (rendering).
 */

const CATEGORIE = ['ristorante', 'attivita-locale', 'freelance-portfolio', 'e-commerce'];

const NOMI_CATEGORIE = {
  'ristorante': 'Ristorante',
  'attivita-locale': 'Attività locale',
  'freelance-portfolio': 'Freelance / Portfolio',
  'e-commerce': 'E-commerce',
};

// 10 layout base per categoria (nomi descrittivi, stabili)
const LAYOUTS = {
  'ristorante': [
    'hero-centrato', 'hero-fullscreen', 'hero-split', 'menu-in-evidenza',
    'griglia-piatti', 'lista-menu-elegante', 'storia-e-foto', 'prenota-subito',
    'serata-eventi', 'minimal-monocromatico',
  ],
  'attivita-locale': [
    'hero-centrato', 'hero-mappa', 'servizi-griglia', 'servizi-lista',
    'recensioni-evidenza', 'orari-e-contatti', 'galleria-lavori', 'prenota-online',
    'chi-siamo-storia', 'minimal-monocromatico',
  ],
  'freelance-portfolio': [
    'hero-personale', 'portfolio-griglia', 'portfolio-masonry', 'cv-timeline',
    'servizi-e-prezzi', 'testimonianze', 'blog-evidenza', 'contatto-diretto',
    'fullscreen-creativo', 'minimal-monocromatico',
  ],
  'e-commerce': [
    'vetrina-hero', 'griglia-prodotti', 'prodotto-in-evidenza', 'categorie-shop',
    'offerte-lampo', 'lookbook', 'recensioni-prodotti', 'checkout-semplice',
    'fullscreen-promo', 'minimal-monocromatico',
  ],
};

// 15 palette/variazioni visive (colori + stile dettagli)
const PALETTES = [
  { nome: 'Terracotta', primaria: '#C05621', secondaria: '#2D3748', sfondo: '#FFF7ED', testo: '#2D3748', accento: '#ED8936', pulsanti: 'arrotondati' },
  { nome: 'Oceano', primaria: '#2B6CB0', secondaria: '#1A365D', sfondo: '#EBF8FF', testo: '#1A202C', accento: '#63B3ED', pulsanti: 'arrotondati' },
  { nome: 'Foresta', primaria: '#276749', secondaria: '#1C4532', sfondo: '#F0FFF4', testo: '#1A202C', accento: '#68D391', pulsanti: 'squadrati' },
  { nome: 'Notte', primaria: '#E2E8F0', secondaria: '#1A202C', sfondo: '#1A202C', testo: '#F7FAFC', accento: '#9F7AEA', pulsanti: 'pill' },
  { nome: 'Sole', primaria: '#D69E2E', secondaria: '#744210', sfondo: '#FFFFF0', testo: '#2D3748', accento: '#F6E05E', pulsanti: 'arrotondati' },
  { nome: 'Rosa Cipria', primaria: '#D53F8C', secondaria: '#702459', sfondo: '#FFF5F7', testo: '#2D3748', accento: '#F687B3', pulsanti: 'pill' },
  { nome: 'Lavanda', primaria: '#6B46C1', secondaria: '#3C366B', sfondo: '#FAF5FF', testo: '#2D3748', accento: '#B794F4', pulsanti: 'arrotondati' },
  { nome: 'Agrumi', primaria: '#DD6B20', secondaria: '#652B19', sfondo: '#FFFAF0', testo: '#2D3748', accento: '#FBD38D', pulsanti: 'squadrati' },
  { nome: 'Menta', primaria: '#2C7A7B', secondaria: '#234E52', sfondo: '#E6FFFA', testo: '#1A202C', accento: '#81E6D9', pulsanti: 'pill' },
  { nome: 'Bordeaux', primaria: '#9B2C2C', secondaria: '#521B1B', sfondo: '#FFF5F5', testo: '#2D3748', accento: '#FC8181', pulsanti: 'arrotondati' },
  { nome: 'Grafite', primaria: '#4A5568', secondaria: '#1A202C', sfondo: '#F7FAFC', testo: '#1A202C', accento: '#A0AEC0', pulsanti: 'squadrati' },
  { nome: 'Sabbia', primaria: '#975A16', secondaria: '#5C3A0E', sfondo: '#FDF8F0', testo: '#3C2A12', accento: '#D6A35C', pulsanti: 'arrotondati' },
  { nome: 'Indaco', primaria: '#434190', secondaria: '#1E1B4B', sfondo: '#EBF4FF', testo: '#1A202C', accento: '#7F9CF5', pulsanti: 'pill' },
  { nome: 'Corallo', primaria: '#E53E3E', secondaria: '#631717', sfondo: '#FFF5F5', testo: '#2D3748', accento: '#FEB2B2', pulsanti: 'arrotondati' },
  { nome: 'Oliva', primaria: '#5F6C37', secondaria: '#2F3A1D', sfondo: '#F7F8EF', testo: '#232A15', accento: '#A3B86B', pulsanti: 'squadrati' },
];

const FONTS = [
  'Playfair Display', 'Montserrat', 'Lora', 'Poppins', 'Merriweather',
  'Inter', 'DM Serif Display', 'Nunito', 'Libre Baskerville', 'Work Sans',
  'Cormorant Garamond', 'Raleway', 'PT Serif', 'Manrope', 'Fraunces',
];

// Nomi "vetrina" per categoria, usati per i nomi univoci dei template
const NOMI_VETRINA = {
  'ristorante': ['Osteria', 'Trattoria', 'Bistrot', 'Pizzeria', 'Enoteca', 'Ristoro', 'Locanda', 'Taverna'],
  'attivita-locale': ['Bottega', 'Studio', 'Officina', 'Atelier', 'Negozio', 'Laboratorio', 'Emporio', 'Salone'],
  'freelance-portfolio': ['Portfolio', 'Studio Creativo', 'Atelier', 'Collezione', 'Showcase', 'Profilo', 'Opere', 'Visioni'],
  'e-commerce': ['Shop', 'Store', 'Boutique', 'Market', 'Emporio', 'Outlet', 'Galleria', 'Bazar'],
};

module.exports = { CATEGORIE, NOMI_CATEGORIE, LAYOUTS, PALETTES, FONTS, NOMI_VETRINA };
