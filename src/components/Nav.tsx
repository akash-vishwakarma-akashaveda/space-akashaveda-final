import { useEffect, useState } from 'react';
import { CONTACT_EMAIL } from '../data/site';
import { useTick } from '../hooks/useTick';
import { useViewportWidth } from '../hooks/useViewportWidth';
import { LANG, S, basePath, link, otherLangHref } from '../i18n';

const utc = () => {
  const t = new Date();
  return 'UTC ' + [t.getUTCHours(), t.getUTCMinutes(), t.getUTCSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
};

/** Ticks once a second on its own so the rest of the page doesn't re-render. */
export function Clock() {
  useTick(1000);
  return <>{utc()}</>;
}

/** Nav targets; `ch` lists the home-page chapters each product link lights up for. */
const LINKS = [
  { key: 'ground', href: '/ground-station', ch: [2, 3] },
  { key: 'vyuh', href: '/vyuh', ch: [4] },
  { key: 'chakra', href: '/chakra', ch: [5] },
  { key: 'team', href: '/#team', ch: [] },
  { key: 'contact', href: '/#contact', ch: [] },
] as const;

/** On a product page its link is active; on the home page, the link for the chapter in view. */
const isActive = (l: (typeof LINKS)[number], ch: number) => (basePath() === '/' ? (l.ch as readonly number[]).includes(ch) : basePath().startsWith(l.href));

export function Nav({ activeChapter = 0 }: { activeChapter?: number }) {
  const w = useViewportWidth();
  const phone = w < 768;
  const [mobileOpen, setMobileOpen] = useState(false);
  const open = phone && mobileOpen;

  // Full-screen menu: the page behind stops scrolling, Escape closes it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const lang = (
    <a href={otherLangHref()} className="nav-lang" hrefLang={LANG === 'hi' ? 'en' : 'hi'} lang={LANG === 'hi' ? 'en' : 'hi'} aria-label={S.nav.langLabel}>
      {S.nav.lang}
    </a>
  );

  return (
    <nav className="nav">
      <a href={basePath() === '/' ? '#top' : link('/')} className="nav-brand">
        <img src="/brand/logo.svg" alt="Akashaveda" width="201" height="42" />
      </a>

      {!phone && (
        <div className="nav-links">
          {LINKS.map((l) => (
            <a key={l.key} href={link(l.href)} className={`nav-link ${isActive(l, activeChapter) ? 'active' : ''}`}>
              {S.nav[l.key]}
            </a>
          ))}
          {lang}
        </div>
      )}

      {phone && (
        <>
          {lang}
          <button onClick={() => setMobileOpen((o) => !o)} aria-label={open ? S.nav.close : S.nav.open} aria-expanded={open} aria-controls="nav-sheet" className={`nav-mobile-toggle ${open ? 'open' : ''}`}>
            <span aria-hidden="true" />
          </button>
        </>
      )}

      {open && (
        <div id="nav-sheet" className="nav-sheet">
          <nav aria-label={S.nav.menu} className="nav-sheet-links">
            {LINKS.map((l, i) => (
              <a key={l.key} href={link(l.href)} onClick={() => setMobileOpen(false)} className={`nav-mobile-link ${isActive(l, activeChapter) ? 'active' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
                <span className="nav-sheet-num">0{i + 1}</span>
                {S.nav[l.key]}
              </a>
            ))}
          </nav>
          <div className="nav-sheet-foot">
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <span><Clock /></span>
          </div>
        </div>
      )}
    </nav>
  );
}
