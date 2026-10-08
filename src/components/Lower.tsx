import { memo, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { COPY, CONTACT_EMAIL } from '../data/site';
import { S, link } from '../i18n';
import { useReveal } from '../hooks/useReveal';
import { Clock } from './Nav';
import { Faq, Split } from './ui';
import type { SpaceBg } from '../scene/spaceBg';

/* ─── Starfield behind the lower page ────────────────────────── */

export function SpaceBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const bg = useRef<SpaceBg | null>(null);
  useEffect(() => {
    let disposed = false;
    import('../scene/spaceBg.js').then((m) => {
      if (disposed || !ref.current) return;
      bg.current = m.mountSpace(ref.current);
    });
    return () => {
      disposed = true;
      bg.current?.dispose();
      bg.current = null;
    };
  }, []);
  return <div ref={ref} aria-hidden="true" className="lw-stars" />;
}

/** Section opener: gold eyebrow, then one bold uppercase line. */
function Head({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <header className="lw-head" data-reveal>
      <p className="lw-eyebrow">{eyebrow}</p>
      <h2 className="lw-title">{typeof children === 'string' ? <Split text={children} /> : children}</h2>
    </header>
  );
}

/* ─── Deployment ─────────────────────────────────────────────── */

const DEPLOY_ICONS = [
  // Cloud: a link up to a hosted core
  <svg key="cloud" viewBox="0 0 48 48" aria-hidden="true"><path d="M14 34h21a8 8 0 0 0 0-16 11 11 0 0 0-21-2A9 9 0 0 0 14 34Z" /><path d="M19 27l4-4 4 3 6-6" /></svg>,
  // On-premise: a rack inside a closed perimeter
  <svg key="prem" viewBox="0 0 48 48" aria-hidden="true"><rect x="15" y="10" width="18" height="28" rx="1" /><path d="M19 16h10M19 22h10M19 28h10" /><path d="M8 42h32M8 6v36M40 6v36" /></svg>,
  // Hybrid: a local core joined to the network
  <svg key="hybrid" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="18" width="14" height="14" rx="1" /><circle cx="36" cy="25" r="7" /><path d="M20 25h9" strokeDasharray="2 3" /><path d="M36 18v-8M36 32v8" /></svg>,
];

function Deployment() {
  return (
    <section id="deploy" className="lw-section">
      <Head eyebrow={S.deploy.eyebrow}>{S.deploy.title}</Head>
      <div className="lw-cols">
        {S.DEPLOY.map((d, i) => (
          <article key={d.t} className="lw-col spot" data-reveal style={{ '--i': i } as CSSProperties}>
            <span className="lw-icon">{DEPLOY_ICONS[i]}</span>
            <span className="lw-num">0{i + 1}</span>
            <h3>{d.t}</h3>
            <p>{d.d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ─── Missions ───────────────────────────────────────────────── */

function Missions() {
  return (
    <section id="missions" className="lw-section lw-split">
      <Head eyebrow={S.missions.eyebrow}>{S.missions.title}</Head>
      <ol className="lw-list">
        {S.USES.map((u, i) => (
          <li key={u.n} className="spot" data-reveal style={{ '--i': i } as CSSProperties}>
            <span className="lw-num">{u.n}</span>
            <h3>{u.t}</h3>
            <p>{u.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─── Leadership ─────────────────────────────────────────────── */

const initials = (n: string) =>
  n.replace(/^Dr /, '').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('');

function Team() {
  return (
    <section id="team" className="lw-section">
      <Head eyebrow={S.team.eyebrow}>{S.team.title}</Head>
      <div className="lw-team">
        {S.TEAM.map((p, i) => (
          <article key={p.n} className="lw-person spot" data-reveal style={{ '--i': i } as CSSProperties}>
            <span className="lw-initials" aria-hidden="true">{initials(COPY.en.TEAM[i].n)}</span>
            <h3>{p.n}</h3>
            <p className="lw-role">{p.r}</p>
            <p>{p.d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ─── Contact ────────────────────────────────────────────────── */

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [requirements, setRequirements] = useState('');
  // Interests are kept by index; the email always names them in English for the team reading it.
  const [picked, setPicked] = useState<number[]>([0]);
  const toggle = (i: number) => setPicked((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  // No backend: the form opens a pre-filled email.
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const subject = `Demo request${name ? ' · ' + name : ''}`;
    const body = [`Name: ${name}`, `Work email: ${email}`, `Interested in: ${picked.map((i) => COPY.en.contact.interests[i]).join(', ') || '—'}`, '', requirements || '(No requirements given)'].join('\n');
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <section id="contact" className="lw-section lw-split">
      <div>
        <Head eyebrow={S.contact.eyebrow}>{S.contact.title}</Head>
        <p className="lw-lede">{S.contact.lede}</p>
        <a className="lw-mail" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </div>
      <form className="lw-form" onSubmit={submit} data-reveal>
        <label>
          <span>{S.contact.name}</span>
          <input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          <span>{S.contact.email}</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          <span>{S.contact.req}</span>
          <textarea rows={3} value={requirements} onChange={(e) => setRequirements(e.target.value)} />
        </label>
        <fieldset>
          <legend>{S.contact.interested}</legend>
          <div className="lw-chips">
            {S.contact.interests.map((t, i) => (
              <button key={t} type="button" aria-pressed={picked.includes(i)} onClick={() => toggle(i)}>{t}</button>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="lw-submit">{S.contact.submit}</button>
      </form>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────── */


export function Footer() {
  return (
    <footer className="lw-footer">
      <div className="lw-foot-grid">
        <div className="lw-foot-brand">
          <a href={link('/')} className="lw-wordmark">
            <img src="/brand/logo.svg" alt="Akashaveda" width="220" height="46" />
          </a>
          <p>{S.footer.tagline}</p>
          <p className="lw-foot-meta">
            <span className="lw-foot-dot" aria-hidden="true" />
            <Clock /> · {S.footer.hq}
          </p>
        </div>
        {S.footer.cols.map((c, i) => (
          <nav key={c.h} aria-label={c.h}>
            <p className="lw-foot-h">{c.h}</p>
            {c.links.map(([t, h]) => <a key={h} href={link(h)}>{t}</a>)}
            {i === S.footer.cols.length - 1 && <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>}
          </nav>
        ))}
      </div>
      <div className="lw-foot-bar">
        <span>{S.footer.copyright}</span>
        <span>{S.footer.illustrative}</span>
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{S.footer.top}</a>
      </div>
      <GiantWordmark />
    </footer>
  );
}

/** The brand wordmark animation across the content width, replaying each time it scrolls into view. */
function GiantWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setPlay((n) => n + 1), { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  // A fresh <img> restarts the SVG's own animation.
  return (
    <div ref={ref} className="lw-giant-wrap" aria-hidden="true">
      <img key={play} className="lw-giant" src="/brand/motion/wordmark.svg" alt="" width="1622" height="244" />
    </div>
  );
}

/* ─── Composition ────────────────────────────────────────────── */

/** Memoized: the page below the journey doesn't depend on the active chapter. */
export const Lower = memo(function Lower() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  return (
    <div className="lw" ref={root}>
      <SpaceBackdrop />
      <div className="lw-inner">
        <Deployment />
        <Missions />
        <Team />
        <section id="faq" className="lw-section lw-split">
          <Head eyebrow={S.faq.eyebrow}>{S.faq.title}</Head>
          <Faq items={S.HOME_FAQ} />
        </section>
        <Contact />
      </div>
      <Footer />
    </div>
  );
});
