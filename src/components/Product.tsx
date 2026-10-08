import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { Block, Icon, ProductPage } from '../data/products';
import { dishUrl, satUrl } from '../scene/assets';
import type { Turntable } from '../scene/turntable';
import { useReveal } from '../hooks/useReveal';
import { Footer, SpaceBackdrop } from './Lower';
import { Faq, Split } from './ui';
import { S, link } from '../i18n';
import { bootDone } from '../boot';

const ICONS: Record<Icon, ReactNode> = {
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="1" /><path d="M3.5 10h17M8 3v4M16 3v4" /><path d="M12 13v3l2 1" /></>,
  bolt: <path d="M13 2 4.5 13.5H12L11 22l8.5-11.5H12L13 2Z" />,
  antenna: <><path d="M12 22V10M8 22h8" /><path d="M5 4.5a10 10 0 0 0 14 0" /><path d="M12 10 17 4" /></>,
  rocket: <><path d="M12 2c3 2.5 4.5 6 4.5 10L12 16l-4.5-4C7.5 8 9 4.5 12 2Z" /><circle cx="12" cy="9" r="1.6" /><path d="M7.5 12 5 15l2.5 1M16.5 12l2.5 3-2.5 1M10 18l2 3 2-3" /></>,
  route: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.7 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.8 7.5-9.5V6L12 3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
};
const Ico = ({ i }: { i: Icon }) => <svg className="pp-ico" viewBox="0 0 24 24" aria-hidden="true">{ICONS[i]}</svg>;

/* ─── Visuals ────────────────────────────────────────────────── */

function ModelVisual({ kind }: { kind: 'dish' | 'sat' }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false, tt: Turntable | null = null;
    import('../scene/turntable.js').then((m) => {
      if (!disposed && ref.current) tt = m.mountTurntable(ref.current, { url: kind === 'dish' ? dishUrl : satUrl, kind });
    });
    return () => { disposed = true; tt?.dispose(); };
  }, [kind]);
  return <div ref={ref} className="pp-model" role="img" aria-label={kind === 'dish' ? S.product.dish : S.product.sat} />;
}

/** Chakra: Earth with three orbits, a catalogue of tracked objects, and one flagged close approach. */
function GlobeVisual() {
  const debris = Array.from({ length: 70 }, (_, i) => {
    const a = (i * 137.5 * Math.PI) / 180, r = 190 + ((i * 53) % 90);
    return [250 + Math.cos(a) * r, 250 + Math.sin(a) * r * 0.62, i % 5 === 0 ? 1.6 : 1] as const;
  });
  const orbits = [
    { rx: 225, ry: 70, rot: -18, dur: 14 },
    { rx: 205, ry: 120, rot: 32, dur: 19 },
    { rx: 240, ry: 46, rot: 8, dur: 23 },
  ];
  return (
    <svg className="pp-globe" viewBox="0 0 500 500" role="img" aria-label={S.product.globe}>
      <defs>
        <radialGradient id="pp-earth" cx="38%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#1b2d4f" />
          <stop offset="70%" stopColor="#0f1e36" />
          <stop offset="100%" stopColor="#050b16" />
        </radialGradient>
      </defs>
      {debris.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#b8c4d6" opacity={0.35} />)}
      <circle cx="250" cy="250" r="150" fill="url(#pp-earth)" stroke="rgba(184,196,214,.45)" />
      <ellipse cx="250" cy="250" rx="150" ry="52" fill="none" stroke="rgba(184,196,214,.12)" />
      <ellipse cx="250" cy="250" rx="62" ry="150" fill="none" stroke="rgba(184,196,214,.12)" />
      {orbits.map((o, i) => {
        const d = `M ${250 - o.rx} 250 a ${o.rx} ${o.ry} 0 1 0 ${2 * o.rx} 0 a ${o.rx} ${o.ry} 0 1 0 ${-2 * o.rx} 0`;
        return (
          <g key={i} transform={`rotate(${o.rot} 250 250)`}>
            <path d={d} fill="none" stroke="rgba(201,162,75,.35)" strokeDasharray="3 6" />
            <circle r="4" fill="#f7f3ea">
              <animateMotion dur={`${o.dur}s`} repeatCount="indefinite" path={d} />
            </circle>
          </g>
        );
      })}
      <g transform="translate(398 168)">
        <circle r="16" fill="none" stroke="#e5604f" className="pp-ping" />
        <circle r="3.5" fill="#e5604f" />
        <circle cx="9" cy="-5" r="2.5" fill="#f7f3ea" />
      </g>
      <text x="420" y="140" className="pp-globe-tag">{S.product.closeApproach}</text>
    </svg>
  );
}

/* ─── Blocks ─────────────────────────────────────────────────── */

function BlockView({ b }: { b: Block }) {
  switch (b.kind) {
    case 'flow':
      return (
        <div>
          {b.label && <p className="pp-label">{b.label}</p>}
          <ol className="pp-flow" data-reveal style={{ ['--n' as string]: b.steps.length }}>
            {b.steps.map((s, i) => (
              <li key={s.t} className={i === b.highlight ? 'on' : undefined} style={{ '--i': i } as CSSProperties}>
                {s.k && <span className="pp-k">{s.k}</span>}
                <span className="pp-step">{s.t}</span>
                {s.d && <p>{s.d}</p>}
              </li>
            ))}
          </ol>
        </div>
      );
    case 'specs':
      return (
        <div className="pp-specs" data-reveal>
          <p className="pp-big">
            <span data-count>{b.big}</span>
            <span>{b.note}</span>
          </p>
          <dl>
            {b.rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case 'features':
      return (
        <div>
          {b.label && <p className="pp-label">{b.label}</p>}
          <div className="pp-features">
            {b.items.map((f, i) => (
              <article key={f.t} className="spot" data-reveal style={{ '--i': i } as CSSProperties}>
                <Ico i={f.icon} />
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </article>
            ))}
          </div>
        </div>
      );
    case 'layers':
      return (
        <ol className="pp-layers">
          {b.items.map((l, i) => (
            <li key={l.t} data-reveal style={{ '--i': i } as CSSProperties}>
              <span className="pp-k">{l.k}</span>
              <span className="pp-step">{l.t}</span>
              <p>{l.d}</p>
            </li>
          ))}
        </ol>
      );
    case 'list':
      return (
        <div>
          <p className="pp-label">{b.label}</p>
          <ul className="pp-list">
            {b.items.map((l, i) => (
              <li key={l.k} className="spot" data-reveal style={{ '--i': i } as CSSProperties}>
                <span className="pp-k">{l.k}</span>
                <span className="pp-step">{l.t}</span>
                {l.d && <p>{l.d}</p>}
              </li>
            ))}
          </ul>
        </div>
      );
    case 'stats':
      return (
        <div>
          <p className="pp-label">{b.label}</p>
          <div className="pp-stats">
            {b.items.map((s, i) => (
              <div key={s.k} data-reveal style={{ '--i': i } as CSSProperties}>
                <span className="pp-stat-v" data-count>{s.v}</span>
                <span className="pp-stat-k">{s.k}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'note':
      return (
        <p className="pp-note" data-reveal>
          <Ico i={b.icon} />
          <span>
            <strong>{b.strong}</strong> {b.text}
          </span>
        </p>
      );
    case 'callout':
      return (
        <aside className="pp-callout" data-reveal>
          <p className="pp-label">
            <Ico i={b.icon} /> {b.eyebrow}
          </p>
          <h3>{b.t}</h3>
          <p>{b.d}</p>
        </aside>
      );
  }
}

/* ─── Page ───────────────────────────────────────────────────── */

export function Product({ page }: { page: ProductPage }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  useEffect(() => {
    document.title = page.seoTitle;
    bootDone();
    document.querySelector('meta[name="description"]')?.setAttribute('content', page.lede);
  }, [page]);
  return (
    <main className="lw pp" ref={root}>
      <SpaceBackdrop />
      <div className="lw-inner">
        <header className="pp-hero">
          <div>
            <a className="pp-back" href={link('/')} data-reveal>{S.product.back}</a>
            <p className="lw-eyebrow" data-reveal style={{ '--i': 1 } as CSSProperties}>{page.eyebrow}</p>
            <h1 className="pp-title" data-reveal style={{ '--i': 2 } as CSSProperties}><Split text={page.title} /></h1>
            <p className="lw-lede" data-reveal style={{ '--i': 3 } as CSSProperties}>{page.lede}</p>
          </div>
          <div className="pp-visual" data-reveal style={{ '--i': 2 } as CSSProperties}>{page.visual === 'globe' ? <GlobeVisual /> : <ModelVisual kind={page.visual} />}</div>
        </header>

        {page.sections.map((s) => (
          <section key={s.eyebrow} className="pp-sec">
            <header className="lw-head" data-reveal>
              <p className="lw-eyebrow">{s.eyebrow}</p>
              {s.title && <h2 className="lw-title"><Split text={s.title} /></h2>}
            </header>
            <div className={s.split ? 'pp-split' : 'pp-stack'}>
              {s.blocks.map((b, i) => <BlockView key={i} b={b} />)}
            </div>
          </section>
        ))}

        <section className="pp-sec lw-split">
          <header className="lw-head" data-reveal>
            <p className="lw-eyebrow">{S.product.questions}</p>
            <h2 className="lw-title"><Split text={S.product.answered(page.name)} /></h2>
          </header>
          <Faq items={page.faq} />
        </section>

        <section className="pp-cta" data-reveal>
          <h2 className="lw-title"><Split text={page.cta} /></h2>
          <a className="lw-submit pp-cta-btn" href={link('/#contact')}>{S.product.talk}</a>
        </section>
      </div>
      <Footer />
    </main>
  );
}
