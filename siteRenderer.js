'use strict';

/**
 * Renderizza il sito pubblico del cliente: HTML dal template + contenuti personalizzati.
 */

function esc(testo) {
  return String(testo ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function stilePulsante(palette) {
  const radius = palette.pulsanti === 'pill' ? '999px' : palette.pulsanti === 'squadrati' ? '4px' : '10px';
  return `display:inline-block;background:${palette.primaria};color:#fff;padding:0.8rem 1.6rem;border-radius:${radius};text-decoration:none;font-weight:600`;
}

function hero(contenuti, palette, layout) {
  const titolo = esc(contenuti.nome_attivita);
  const tagline = esc(contenuti.tagline);
  if (layout.includes('fullscreen')) {
    return `<section style="min-height:70vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:linear-gradient(135deg,${palette.primaria},${palette.secondaria});color:#fff;padding:4rem 1.5rem">
      <h1 style="font-size:3rem;margin:0 0 1rem">${titolo}</h1><p style="font-size:1.3rem;opacity:.9">${tagline}</p></section>`;
  }
  if (layout.includes('split') || layout.includes('personale')) {
    return `<section style="display:flex;flex-wrap:wrap;align-items:center;gap:2rem;padding:4rem 1.5rem;max-width:1100px;margin:0 auto">
      <div style="flex:1;min-width:260px"><h1 style="font-size:2.6rem;margin:0 0 1rem">${titolo}</h1>
      <p style="font-size:1.2rem;color:${palette.secondaria}">${tagline}</p>
      <p>${esc(contenuti.descrizione)}</p></div>
      <div style="flex:1;min-width:260px;background:${palette.accento};border-radius:16px;min-height:280px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem">La tua foto qui</div></section>`;
  }
  return `<section style="text-align:center;padding:4rem 1.5rem;background:${palette.sfondo}">
    <h1 style="font-size:2.8rem;margin:0 0 1rem">${titolo}</h1><p style="font-size:1.25rem">${tagline}</p></section>`;
}

function sezioniCategoria(contenuti, palette, categoria) {
  const card = (titolo, corpo, extra = '') =>
    `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <h3 style="margin-top:0;color:${palette.primaria}">${esc(titolo)}</h3><p>${esc(corpo)}</p>${extra}</div>`;
  const griglia = (items) =>
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.25rem">${items}</div>`;

  if (categoria === 'ristorante' && contenuti.piatti) {
    return `<section style="max-width:1100px;margin:0 auto;padding:2rem 1.5rem"><h2>Il nostro menu</h2>${griglia(contenuti.piatti.map((p) =>
      card(p.nome, p.descrizione, `<strong>${esc(p.prezzo)}</strong>`)).join(''))}</section>
      <section style="max-width:1100px;margin:0 auto;padding:1rem 1.5rem 3rem"><p><strong>Orari:</strong> ${esc(contenuti.orari)}</p></section>`;
  }
  if (categoria === 'attivita-locale' && contenuti.servizi) {
    return `<section style="max-width:1100px;margin:0 auto;padding:2rem 1.5rem"><h2>I nostri servizi</h2>${griglia(contenuti.servizi.map((s) =>
      card(s.nome, s.descrizione)).join(''))}</section>
      <section style="max-width:1100px;margin:0 auto;padding:1rem 1.5rem 3rem"><p><strong>Orari:</strong> ${esc(contenuti.orari)}</p></section>`;
  }
  if (categoria === 'freelance-portfolio' && contenuti.progetti) {
    return `<section style="max-width:1100px;margin:0 auto;padding:2rem 1.5rem"><h2 style="color:${palette.secondaria}">${esc(contenuti.ruolo)}</h2>
      <p>${esc(contenuti.bio)}</p><h2>Progetti</h2>${griglia(contenuti.progetti.map((p) =>
      card(p.titolo, p.descrizione)).join(''))}</section>`;
  }
  if (categoria === 'e-commerce' && contenuti.prodotti) {
    return `<section style="max-width:1100px;margin:0 auto;padding:2rem 1.5rem"><h2>I nostri prodotti</h2>${griglia(contenuti.prodotti.map((p) =>
      card(p.nome, p.descrizione, `<div style="margin-top:.5rem"><strong>${esc(p.prezzo)}</strong>
      <a href="mailto:${esc(contenuti.email)}?subject=Ordine: ${esc(p.nome)}" style="${stilePulsante(palette)};margin-left:.75rem;padding:.5rem 1rem">Ordina</a></div>`)).join(''))}</section>`;
  }
  return `<section style="max-width:1100px;margin:0 auto;padding:2rem 1.5rem"><p>${esc(contenuti.descrizione)}</p></section>`;
}

function renderSito({ sito, template, contenuti }) {
  const palette = JSON.parse(template.palette);
  const font = template.font;
  const titolo = esc(contenuti.nome_attivita || template.nome);

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titolo} — powered by Sitevaro</title>
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700&display=swap" rel="stylesheet">
<style>body{font-family:'${font}',system-ui,sans-serif;margin:0;background:${palette.sfondo};color:${palette.testo}}h1,h2,h3{font-family:'${font}',serif}</style>
</head>
<body>
<header style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;background:${palette.secondaria};color:#fff">
  <strong style="font-size:1.2rem">${titolo}</strong>
  <a href="tel:${esc(contenuti.telefono)}" style="color:#fff;text-decoration:none">${esc(contenuti.telefono)}</a>
</header>
${hero(contenuti, palette, template.layout)}
${sezioniCategoria(contenuti, palette, template.categoria)}
<footer style="background:${palette.secondaria};color:#fff;padding:2rem 1.5rem;text-align:center">
  <p style="margin:.25rem">${esc(contenuti.indirizzo)} · ${esc(contenuti.email)}</p>
  <p style="margin:.25rem;opacity:.7;font-size:.85rem">Sito creato con Sitevaro · Template ${esc(template.nome)}</p>
</footer>
</body>
</html>`;
}

module.exports = { renderSito };
