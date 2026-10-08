// After `vite build`: one real HTML file per page and language (/, /ground-station, /vyuh, /chakra, and the same
// under /hi), so search engines and AI crawlers that don't run JavaScript still get each page's title, description,
// canonical and hreflang links, social tags, structured data (JSON-LD) and full text. The app replaces the text
// when it starts (index.html hides it from JS readers). Also writes sitemap.xml, robots.txt and llms.txt.
// Copy comes from src/data, the same source the pages render from.
// Run: npm run build (runs this last), or npm run seo after a build. Set SITE_URL for another domain.
import fs from 'node:fs';
import path from 'node:path';
import { COPY, CONTACT_EMAIL } from '../src/data/site.ts';
import { PRODUCTS } from '../src/data/products.ts';
import { PRODUCTS_HI } from '../src/data/products.hi.ts';


const SITE = (process.env.SITE_URL || 'https://akashaveda.com').replace(/\/$/, '');
const DIST = 'dist';
const ORG_ID = `${SITE}/#org`;
const IMAGE = `${SITE}/brand/og.png`; // 1200×630 social preview
const LOGO = `${SITE}/brand/icon-512.png`;
const DEVANAGARI = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap';
const today = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
/** A site path in a language: '/vyuh' → '/hi/vyuh', '/' → '/hi/'. */
const at = (lang, p) => (lang === 'hi' ? `/hi${p}` : p);

const LANGS = {
  en: { products: PRODUCTS, name: 'Akashaveda', home: { title: 'Akashaveda · Ground segment as a service', description: 'Ground station passes, mission control and space safety for satellite operators: the GS-01 tri-band ground station, Vyuh mission control and Chakra SSA.' } },
  hi: { products: PRODUCTS_HI, name: 'आकाशवेद', home: { title: 'आकाशवेद · ग्राउंड सेगमेंट ऐज़ ए सर्विस', description: 'सैटेलाइट ऑपरेटरों के लिए ग्राउंड स्टेशन पास, मिशन कंट्रोल और अंतरिक्ष सुरक्षा: GS-01 ट्राई-बैंड ग्राउंड स्टेशन, व्यूह मिशन कंट्रोल और चक्र SSA।' } },
};

/* ─── Structured data ───────────────────────────────────────── */

const org = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Akashaveda',
  alternateName: 'आकाशवेद',
  url: `${SITE}/`,
  logo: LOGO,
  email: CONTACT_EMAIL,
  slogan: 'Space is far. We keep it close.',
  description: 'End-to-end ground segment as a service: ground station passes, mission control and space situational awareness for satellite operators, with India’s first commercial 7.5 m antenna.',
  address: { '@type': 'PostalAddress', addressLocality: 'Bangalore', addressCountry: 'IN' },
  employee: COPY.en.TEAM.filter((p) => !/advisor/i.test(p.r)).map((p) => ({ '@type': 'Person', name: p.n, jobTitle: p.r.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) })),
  knowsAbout: ['Ground station as a service', 'TT&C', 'Satellite mission control', 'Flight dynamics', 'Mission design and analysis', 'Space situational awareness', 'Conjunction screening', 'Collision avoidance'],
};
const website = { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'Akashaveda', inLanguage: ['en', 'hi'], publisher: { '@id': ORG_ID } };
const faqPage = (url, items, lang) => ({
  '@type': 'FAQPage',
  '@id': `${url}#faq`,
  inLanguage: lang,
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

function graph(page, lang) {
  const url = SITE + page.url;
  if (page.home) return [org, website, { '@type': 'WebPage', '@id': url, url, name: page.title, description: page.description, inLanguage: lang, isPartOf: { '@id': website['@id'] }, about: { '@id': ORG_ID } }, faqPage(url, COPY[lang].HOME_FAQ, lang)];
  return [
    org,
    website,
    { '@type': 'Service', '@id': `${url}#service`, name: page.name, serviceType: page.eyebrow.split('·').pop().trim(), description: page.lede, url, inLanguage: lang, provider: { '@id': ORG_ID } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: LANGS[lang].name, item: SITE + at(lang, '/') }, { '@type': 'ListItem', position: 2, name: page.name, item: url }] },
    faqPage(url, page.faq, lang),
  ];
}

/* ─── Page text ─────────────────────────────────────────────── */

const faqHtml = (S, items) => `<section><h2>${esc(S.faq.eyebrow)}</h2><dl>${items.map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`).join('')}</dl></section>`;

function blockHtml(b) {
  switch (b.kind) {
    case 'flow': return `<ol>${b.steps.map((s) => `<li>${s.k ? `${esc(s.k)}: ` : ''}<strong>${esc(s.t)}</strong>${s.d ? ` — ${esc(s.d)}` : ''}</li>`).join('')}</ol>`;
    case 'specs': return `<p><strong>${esc(b.big)}</strong> ${esc(b.note)}</p><dl>${b.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
    case 'features': return `${b.label ? `<h3>${esc(b.label)}</h3>` : ''}<ul>${b.items.map((f) => `<li><strong>${esc(f.t)}</strong> — ${esc(f.d)}</li>`).join('')}</ul>`;
    case 'layers': return `<ol>${b.items.map((l) => `<li>${esc(l.k)}: <strong>${esc(l.t)}</strong> — ${esc(l.d)}</li>`).join('')}</ol>`;
    case 'list': return `<h3>${esc(b.label)}</h3><ul>${b.items.map((l) => `<li>${esc(l.k)}: <strong>${esc(l.t)}</strong>${l.d ? ` — ${esc(l.d)}` : ''}</li>`).join('')}</ul>`;
    case 'stats': return `<h3>${esc(b.label)}</h3><ul>${b.items.map((s) => `<li><strong>${esc(s.v)}</strong> ${esc(s.k)}</li>`).join('')}</ul>`;
    case 'note': return `<p><strong>${esc(b.strong)}</strong> ${esc(b.text)}</p>`;
    case 'callout': return `<aside><h3>${esc(b.t)}</h3><p>${esc(b.d)}</p></aside>`;
  }
  return '';
}

function bodyHtml(page, lang) {
  const S = COPY[lang], products = LANGS[lang].products;
  const nav = `<nav><a href="${at(lang, '/')}">${LANGS[lang].name}</a> · ${products.map((p) => `<a href="${at(lang, p.path)}">${esc(p.name)}</a>`).join(' · ')} · <a href="${at(lang, '/#team')}">${esc(S.nav.team)}</a> · <a href="${at(lang, '/#contact')}">${esc(S.nav.contact)}</a> · <a href="${at(lang === 'hi' ? 'en' : 'hi', page.home ? '/' : page.path)}">${esc(S.nav.lang)}</a></nav>`;
  const footer = `<footer><p><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> · ${esc(S.footer.hq)} · ${esc(S.footer.copyright)}</p></footer>`;
  if (page.home)
    return `${nav}<main><header><p>${esc(S.hero.eyebrow)}</p><h1>${esc(S.hero.l1)} ${esc(S.hero.l2)}</h1><p>${esc(page.description)}</p></header>`
      + `<section>${products.map((p) => `<article><h2><a href="${at(lang, p.path)}">${esc(p.name)}</a></h2><p>${esc(p.title)} ${esc(p.lede)}</p></article>`).join('')}</section>`
      + `<section><h2>${esc(S.cards.up.title)}</h2><p>${esc(S.cards.up.lede)}</p><ol>${S.loop.map((l) => `<li>${esc(l.k)}: ${esc(l.t)}</li>`).join('')}</ol></section>`
      + `<section><h2>${esc(S.deploy.title)}</h2><ul>${S.DEPLOY.map((d) => `<li><strong>${esc(d.t)}</strong> — ${esc(d.d)}</li>`).join('')}</ul></section>`
      + `<section><h2>${esc(S.missions.title)}</h2><ul>${S.USES.map((u) => `<li><strong>${esc(u.t)}</strong> — ${esc(u.d)}</li>`).join('')}</ul></section>`
      + `<section id="team"><h2>${esc(S.team.eyebrow)}</h2><ul>${S.TEAM.map((p) => `<li><strong>${esc(p.n)}</strong>, ${esc(p.r)} — ${esc(p.d)}</li>`).join('')}</ul></section>`
      + `${faqHtml(S, S.HOME_FAQ)}<section id="contact"><h2>${esc(S.contact.title)}</h2><p>${esc(S.contact.lede)}</p></section></main>${footer}`;
  return `${nav}<main><header><p>${esc(page.eyebrow)}</p><h1>${esc(page.title)}</h1><p>${esc(page.lede)}</p></header>`
    + page.sections.map((s) => `<section><h2>${esc(s.title || s.eyebrow)}</h2>${s.blocks.map(blockHtml).join('')}</section>`).join('')
    + `${faqHtml(S, page.faq)}<p><a href="${at(lang, '/#contact')}">${esc(page.cta)} ${esc(S.product.talk)}</a></p></main>${footer}`;
}

/* ─── Write the pages ───────────────────────────────────────── */

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const pages = [];
for (const lang of ['en', 'hi']) {
  const L = LANGS[lang];
  pages.push({ lang, home: true, base: '/', url: at(lang, '/'), ...L.home });
  for (const p of L.products) pages.push({ lang, ...p, base: p.path, url: at(lang, p.path), title: p.seoTitle, description: p.lede });
}

for (const page of pages) {
  const url = SITE + page.url;
  const alt = (l) => SITE + at(l, page.base);
  const head = [
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" hreflang="en" href="${alt('en')}" />`,
    `<link rel="alternate" hreflang="hi" href="${alt('hi')}" />`,
    `<link rel="alternate" hreflang="x-default" href="${alt('en')}" />`,
    ...(page.lang === 'hi' ? [`<link rel="stylesheet" href="${DEVANAGARI}" />`] : []),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Akashaveda" />`,
    `<meta property="og:locale" content="${page.lang === 'hi' ? 'hi_IN' : 'en_IN'}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Akashaveda" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${IMAGE}" />`,
    `<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': graph(page, page.lang) })}</script>`,
  ].join('\n    ');
  const html = template
    .replace('<html lang="en">', `<html lang="${page.lang}">`)
    .replace(/<span class="bt">[^<]*<\/span><b>\.<\/b>/g, ((k) => () => `<span class="bt">${esc(COPY[page.lang].boot.words[k++])}</span><b>${COPY[page.lang].beatDot}</b>`)(0))
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(page.description)}" />`)
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"><div class="seo-static">${bodyHtml(page, page.lang)}</div></div>`);
  const out = path.join(DIST, page.url, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`seo: ${out}`);
}

/* ─── Crawler files ─────────────────────────────────────────── */

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map((p) => `  <url>
    <loc>${SITE}${p.url}</loc><lastmod>${today}</lastmod><priority>${p.home ? '1.0' : '0.8'}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${at('en', p.base)}" />
    <xhtml:link rel="alternate" hreflang="hi" href="${SITE}${at('hi', p.base)}" />
  </url>`).join('\n')}
</urlset>
`);

// Search and AI crawlers are all welcome; the named ones are listed so the intent is explicit.
fs.writeFileSync(path.join(DIST, 'robots.txt'), `${['*', 'Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'].map((a) => `User-agent: ${a}\nAllow: /`).join('\n\n')}

Sitemap: ${SITE}/sitemap.xml
`);

// llms.txt: a plain-language brief for AI assistants (llmstxt.org), in English with links to both languages.
const E = COPY.en;
const md = (p) => `## ${p.name}\n\n${p.title} ${p.lede}\n\n${p.sections.flatMap((s) => s.blocks).map((b) => {
  if (b.kind === 'specs') return [`- ${b.big} ${b.note}`, ...b.rows.map(([k, v]) => `- ${k}: ${v}`)].join('\n');
  if (b.kind === 'features') return b.items.map((f) => `- ${f.t}: ${f.d}`).join('\n');
  if (b.kind === 'layers') return b.items.map((l) => `- ${l.k} (${l.t}): ${l.d}`).join('\n');
  if (b.kind === 'list') return `${b.label}:\n${b.items.map((l) => `- ${l.k} ${l.t}${l.d ? `: ${l.d}` : ''}`).join('\n')}`;
  if (b.kind === 'stats') return `${b.label}:\n${b.items.map((s) => `- ${s.v} ${s.k}`).join('\n')}`;
  if (b.kind === 'flow') return b.steps.map((s) => `${s.k ? `${s.k}: ` : ''}${s.t}${s.d ? ` (${s.d})` : ''}`).join(' → ');
  if (b.kind === 'note') return `${b.strong} ${b.text}`;
  if (b.kind === 'callout') return `${b.t}: ${b.d}`;
  return '';
}).join('\n\n')}\n\nMore: ${SITE}${p.path} · Hindi: ${SITE}/hi${p.path}\n`;
fs.writeFileSync(path.join(DIST, 'llms.txt'), `# Akashaveda (आकाशवेद)

> End-to-end ground segment as a service. Akashaveda provides ground station passes (GS-01, India’s first commercial 7.5 m antenna, S/X/Ka band), mission control (Vyuh), mission design and analysis (IMAP) and space situational awareness (Chakra) for satellite operators. Headquartered in Bangalore, India. Contact: ${CONTACT_EMAIL}. The site is in English and Hindi (${SITE}/hi/).

${PRODUCTS.map(md).join('\n')}
## Deployment

${E.DEPLOY.map((d) => `- ${d.t}: ${d.d}`).join('\n')}

## Missions served

${E.USES.map((u) => `- ${u.t}: ${u.d}`).join('\n')}

## Leadership

${E.TEAM.map((p) => `- ${p.n}, ${p.r.toLowerCase()}: ${p.d}`).join('\n')}

## Questions

${[...E.HOME_FAQ, ...PRODUCTS.flatMap((p) => p.faq)].map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n')}

## Pages

- [Home](${SITE}/) · [हिंदी](${SITE}/hi/)
${PRODUCTS.map((p, i) => `- [${p.name}](${SITE}${p.path}) · [${PRODUCTS_HI[i].name}](${SITE}/hi${p.path})`).join('\n')}
`);
console.log('seo: sitemap.xml, robots.txt, llms.txt');
