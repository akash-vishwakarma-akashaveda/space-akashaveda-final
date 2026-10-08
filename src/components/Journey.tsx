import { memo, useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type ReactNode, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { SHOW_RESOLUTIONS } from '../data/content';
import { LANG, S, link } from '../i18n';
import { bootDone } from '../boot';
import { useReveal } from '../hooks/useReveal';
import { useTick } from '../hooks/useTick';
import { dishUrl, satUrl } from '../scene/assets';
import type { GSScene } from '../scene/gsScene';
import { ChakraConsole, GSConsole, VyuhConsole, type ConsoleState } from './Consoles';
import { SecHead, Split, padX } from './ui';

/** Scene progress at each chapter midpoint (ch0, ch3, ch4–ch8); interpolated linearly between them. */
const Q = [-0.3, 0.0, 0.2, 0.4, 0.6, 0.8, 1];

/** Colours for the uplink loop's steps (Chakra, Vyuh, GS-01, record). */
const LOOP_C = ['var(--risk)', 'var(--accT)', 'var(--tc)', 'var(--ok)'];

type ModalKey = 'gs' | 'mcs' | 'ssa';
const MODAL_WIDTH: Record<ModalKey, number> = { gs: 720, mcs: 920, ssa: 920 };

const chBase = { minHeight: '100vh', display: 'flex', maxWidth: 1480, margin: '0 auto' } as const;
const chHero = { ...chBase, alignItems: 'center', padding: `84px ${padX} 84px`, position: 'relative' } as const;
const chCard = { ...chBase, alignItems: 'flex-end', padding: `110px ${padX} 84px` } as const;
const chSide = { ...chBase, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: `100px ${padX} 80px`, position: 'relative' } as const;

/** Chapter card: no frame, a soft dark glow behind the text (see .hud-card). */
function Hud({ children }: { children: ReactNode }) {
  return <div className="hud-card" data-reveal>{children}</div>;
}

/** A card's readouts: label over value, one column each. */
function Stats({ rows, colors = [] }: { rows: string[][]; colors?: string[] }) {
  return (
    <div className="hud-stats-strip">
      {rows.map(([k, v], i) => (
        <div key={k} className="hud-stat-box">
          <span className="hud-stat-k">{k}</span>
          <span className="hud-stat-v" style={colors[i] ? { color: colors[i] } : undefined}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function OpenConsoleButton({ onClick, title, subtitle, color = 'var(--accT)' }: { onClick: () => void; title: string; subtitle: string; color?: string }) {
  return (
    <button type="button" onClick={onClick} className="hud-open" style={{ ['--btn-glow' as string]: color }}>
      <span className="hud-open-dot" aria-hidden="true" />
      <span className="hud-open-text">
        <span className="hud-open-title">{title}</span>
        <span className="hud-open-sub">{subtitle}</span>
      </span>
      <span className="hud-open-go">OPEN ↗</span>
    </button>
  );
}

function ConsoleModal({ k, onClose, children }: { k: ModalKey; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <>
      <div className="cm-backdrop" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={S.modal[k]} className="dash cm force-dark" style={{ width: `min(94vw,${MODAL_WIDTH[k]}px)` }}>
        <div className="cm-bar">
          <span className="cm-name">{S.modal[k]}</span>
          <span className="cm-sim">{S.modal.sim}</span>
          <button onClick={onClose} autoFocus className="cm-close">{S.modal.close}</button>
        </div>
        {children}
      </div>
    </>,
    document.body,
  );
}

interface SolutionCardItem {
  id: string;
  idx: string;
  pillar: string;
  badge: string;
  title: string;
  desc: string;
  tags: string[];
  color: string;
  href: string;
  cta: string;
}

const SOLUTION_CARDS: SolutionCardItem[] = [
  {
    id: 'gs',
    idx: '01',
    pillar: 'REACH',
    badge: 'GS-01 · GSaaS',
    title: 'Ground Station Network',
    desc: 'On-demand multi-band TT&C, carrier tracking, and high-rate payload downlink across distributed apertures.',
    tags: ['S / X / Ka-Band', 'Automated Passes'],
    color: 'var(--tm)',
    href: '#ch5',
    cta: 'Explore GS-01 console →',
  },
  {
    id: 'mcs',
    idx: '02',
    pillar: 'CONTROL',
    badge: 'VYUH · MCS',
    title: 'Unified Mission Control',
    desc: 'Real-time telemetry parsing, fleet subsystem health monitoring, and cryptographic dual-auth command queues.',
    tags: ['Live Telemetry Decom', 'Dual-Auth Uplink'],
    color: 'var(--acc)',
    href: '#ch6',
    cta: 'Explore Vyuh dashboard →',
  },
  {
    id: 'ssa',
    idx: '03',
    pillar: 'COMPREHEND',
    badge: 'CHAKRA · SSA',
    title: 'Orbital Safety & SSA',
    desc: 'Automated conjunction screening against space catalogs with covariance analysis and verified avoidance maneuvers.',
    tags: ['Conjunction Triage', '1-Click Avoidance'],
    color: 'var(--risk)',
    href: '#ch7',
    cta: 'Explore Chakra dashboard →',
  },
];

function SolutionDeck() {
  const [isSeparated, setIsSeparated] = useState(false);

  return (
    <div className="solution-deck-section">
      {/* Interactive Deck Control Header */}
      <div className="deck-control-bar">
        <button
          type="button"
          onClick={() => setIsSeparated((s) => !s)}
          className={`deck-toggle-btn ${isSeparated ? 'active' : ''}`}
          aria-expanded={isSeparated}
        >
          <span className="deck-pulse-dot" />
          <span>{isSeparated ? '✕ STACK DECK' : '⛶ SEPARATE DECK (3 CAPABILITIES)'}</span>
        </button>
        <span className="mono deck-hint">
          {isSeparated ? 'CARDS EXPANDED · CLICK CARD CTA TO NAVIGATE' : 'CLICK DECK OR BUTTON TO SEPARATE'}
        </span>
      </div>

      {/* Tactile Card Deck Stage */}
      <div
        className={`deck-stage ${isSeparated ? 'separated' : 'stacked'}`}
        onClick={() => {
          if (!isSeparated) setIsSeparated(true);
        }}
      >
        {SOLUTION_CARDS.map((c, i) => (
          <div
            key={c.id}
            className={`deck-card deck-card-${i}`}
            onClick={(e) => {
              if (!isSeparated) {
                e.preventDefault();
                setIsSeparated(true);
              }
            }}
          >
            {/* Top Luminous Rim Line */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 18,
                right: 18,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${c.color}, transparent)`,
                borderRadius: 2,
              }}
            />

            {/* Card Header: Pillar + Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '.12em', color: c.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
                <span>{c.idx} · {c.pillar}</span>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '.08em',
                  padding: '3px 8px',
                  borderRadius: 3,
                  background: 'var(--panel2)',
                  border: '1px solid var(--line2)',
                  color: 'var(--ink2)',
                }}
              >
                {c.badge}
              </span>
            </div>

            {/* Card Body: Title & Desc */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '8px 0' }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--ink)' }}>
                {c.title}
              </h3>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink2)' }}>
                {c.desc}
              </p>
            </div>

            {/* Capability Feature Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '4px 0 10px' }}>
              {c.tags.map((t) => (
                <span
                  key={t}
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    letterSpacing: '.04em',
                    padding: '3px 8px',
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Card Footer: CTA Link */}
            <div style={{ paddingTop: 12, borderTop: '1px solid var(--line)', marginTop: 'auto' }}>
              <a
                href={c.href}
                className="deck-card-cta"
                style={{ color: c.color }}
                onClick={(e) => {
                  if (!isSeparated) {
                    e.preventDefault();
                    setIsSeparated(true);
                  }
                }}
              >
                <span>{c.cta}</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Chapter content never depends on scroll position, so it is memoized and scrolling doesn't re-render it. */
const Chapters = memo(function Chapters({ onOpen }: { onOpen: (k: ModalKey) => void }) {
  return (
    <div style={{ position: 'relative', marginTop: '-100vh' }}>
      {/* ch0 · Hero */}
      <div id="ch0" data-ch="0" style={chHero}>
        <div className="hero">
          <p className="hero-eyebrow">{S.hero.eyebrow}</p>
          <h1 className="hero-title">
            <Split text={S.hero.l1} />
            <br />
            <span className="hero-gold">
              <Split text={S.hero.l2} from={S.hero.l1.split(' ').length} />
            </span>
          </h1>
        </div>
      </div>

      {/* ch3 · Resolutions Deck, or while it's hidden, the satellite sequence (up close, the downlink travelling
          down, the ground station revealed) with one bold line passing at a time. */}
      {!SHOW_RESOLUTIONS && (
        <div id="ch3" data-ch="1" className="beats" style={{ padding: `0 ${padX}` }}>
          {S.beats.map((b) => (
            <div key={b.k} className="beat" data-reveal>
              <p className="beat-line">
                <span className="sr-only">{b.k}{S.beatDot}</span>
                <span aria-hidden="true">
                  <Split text={b.k} chars={LANG === 'en'} />
                  <span className="sw beat-dot" style={{ ['--wi' as string]: b.k.length }}>
                    <span>{S.beatDot}</span>
                  </span>
                </span>
              </p>
              <p className="beat-sub">{b.t}</p>
            </div>
          ))}
        </div>
      )}
      {SHOW_RESOLUTIONS && (
      <div id="ch3" data-ch="1" style={chSide}>
        <span id="resolutions" style={{ position: 'absolute', top: -60, pointerEvents: 'none' }} />
        <span id="integrations" style={{ position: 'absolute', top: -60, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1060, width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            <SecHead label="RESOLUTIONS" color="var(--accT)" />
            <h2
              className="h-chapter"
              style={{
                margin: 0,
                fontWeight: 700,
                letterSpacing: '-.02em',
                color: 'var(--ink)',
                textShadow: '0 2px 28px rgba(0, 0, 0, 0.9)',
              }}
            >
              Resolutions
            </h2>
          </div>

          <SolutionDeck />
        </div>
      </div>
      )}

      {/* ch4 · Acquisition */}
      <div id="ch4" data-ch="2" style={chCard}>
        <Hud>
          <SecHead label={S.cards.acq.label} tag={S.cards.acq.tag} color="var(--tm)" />
          <h2 className="h-chapter" style={{ margin: 0 }}>{S.cards.acq.title}</h2>
          <p className="lede" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink2)' }}>{S.cards.acq.lede}</p>
          <Stats rows={S.cards.acq.stats} colors={['var(--ok)', 'var(--tm)', 'var(--tc)']} />
        </Hud>
      </div>

      {/* ch5 · Ground station */}
      <div id="ch5" data-ch="3" style={chCard}>
        <Hud>
          <SecHead label={S.cards.gs.label} tag={S.cards.gs.tag} color="var(--accT)" />
          <h2 className="h-chapter" style={{ margin: 0 }}>{S.cards.gs.title}</h2>
          <OpenConsoleButton onClick={() => onOpen('gs')} title={S.cards.gs.console} subtitle={S.cards.gs.consoleSub} color="var(--accT)" />
          <p className="lede" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink2)' }}>{S.cards.gs.lede}</p>
          <Stats rows={S.cards.gs.stats} colors={['var(--ink)', 'var(--acc)']} />
          <a className="hud-more" href={link('/ground-station')}>{S.readMore}</a>
        </Hud>
      </div>

      {/* ch6 · Vyuh MCS */}
      <div id="ch6" data-ch="4" style={chCard}>
        <Hud>
          <SecHead label={S.cards.mcs.label} tag={S.cards.mcs.tag} color="var(--acc)" />
          <h2 className="h-chapter" style={{ margin: 0 }}>{S.cards.mcs.title}</h2>
          <OpenConsoleButton onClick={() => onOpen('mcs')} title={S.cards.mcs.console} subtitle={S.cards.mcs.consoleSub} color="var(--acc)" />
          <p className="lede" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink2)' }}>{S.cards.mcs.lede}</p>
          <Stats rows={S.cards.mcs.stats} />
          <a className="hud-more" href={link('/vyuh')}>{S.readMore}</a>
        </Hud>
      </div>

      {/* ch7 · Chakra SSA */}
      <div id="ch7" data-ch="5" style={chCard}>
        <Hud>
          <SecHead label={S.cards.ssa.label} tag={S.cards.ssa.tag} color="var(--risk)" />
          <h2 className="h-chapter" style={{ margin: 0 }}>{S.cards.ssa.title}</h2>
          <OpenConsoleButton onClick={() => onOpen('ssa')} title={S.cards.ssa.console} subtitle={S.cards.ssa.consoleSub} color="var(--risk)" />
          <p className="lede" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink2)' }}>{S.cards.ssa.lede}</p>
          <Stats rows={S.cards.ssa.stats} />
          <a className="hud-more" href={link('/chakra')}>{S.readMore}</a>
        </Hud>
      </div>

      {/* ch8 · Uplink */}
      <div id="ch8" data-ch="6" style={chCard}>
        <Hud>
          <SecHead label={S.cards.up.label} tag={S.cards.up.tag} color="var(--tc)" />
          <h2 className="h-chapter" style={{ margin: 0 }}>{S.cards.up.title}</h2>
          <p className="lede" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink2)' }}>{S.cards.up.lede}</p>
          <div className="hud-pipeline">
            {S.loop.map((l, i) => (
              <div key={l.k} className="hud-pipeline-item">
                <span className="hud-pipeline-tag" style={{ color: LOOP_C[i] }}>
                  {l.k}
                </span>
                <span className="hud-pipeline-text">{l.t}</span>
                <span className="hud-pipeline-check mono" style={{ color: LOOP_C[i] }}>✓</span>
              </div>
            ))}
          </div>
        </Hud>
      </div>
    </div>
  );
});

/** Console pop-up body: owns the 800 ms telemetry tick so only the open dashboard re-renders. */
function ModalBody({ k, progress, chapter, cs, setCs }: { k: ModalKey; progress: MutableRefObject<number>; chapter: number; cs: ConsoleState; setCs: Dispatch<SetStateAction<ConsoleState>> }) {
  const tick = useTick(800);
  const p = Math.max(0, progress.current);
  if (k === 'gs') return <GSConsole p={p} chapter={chapter} tick={tick} />;
  if (k === 'mcs') return <VyuhConsole p={p} tick={tick} s={cs} onSelectSat={(i) => setCs((s) => ({ ...s, fleetSel: i }))} onApprove={() => setCs((s) => ({ ...s, approved: true }))} />;
  return <ChakraConsole s={cs} onSelectEvent={(i) => setCs((s) => ({ ...s, sel: i }))} onSend={() => setCs((s) => ({ ...s, sent: true }))} />;
}

export const Journey = memo(function Journey({ onChapter }: { onChapter: (ci: number) => void }) {
  const rootRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  useReveal(rootRef);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GSScene | null>(null);
  const progress = useRef(-0.3);
  const centers = useRef<number[]>([]);
  // Only the chapter index lives in state; raw progress goes straight to the scene.
  const [ci, setCi] = useState(0);
  const [modal, setModal] = useState<ModalKey | null>(null);
  // Shared across pop-ups so a Chakra decision shows up in the Vyuh queue.
  const [cs, setCs] = useState<ConsoleState>({ fleetSel: 0, approved: false, sent: false, sel: 0 });

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    centers.current = [...root.querySelectorAll<HTMLElement>('[data-ch]')].map((e) => {
      const r = e.getBoundingClientRect();
      return r.top + window.scrollY + r.height / 2;
    });
  }, []);

  const update = useCallback(() => {
    const abs = centers.current;
    if (!abs.length) return;
    const c = window.innerHeight / 2 + window.scrollY;
    let f: number;
    if (c <= abs[0]) f = 0;
    else if (c >= abs[abs.length - 1]) f = abs.length - 1;
    else {
      let i = 0;
      while (c > abs[i + 1]) i++;
      f = i + (c - abs[i]) / (abs[i + 1] - abs[i]);
    }
    const i0 = Math.min(Q.length - 2, Math.floor(f));
    const p = Q[i0] + (Q[i0 + 1] - Q[i0]) * (f - i0);
    progress.current = p;
    sceneRef.current?.setProgress(p);
    setCi(Math.round(f));
    // The hero headline drifts up and fades as the story starts, and returns on the way back.
    const hero = (heroRef.current ??= document.querySelector<HTMLElement>('#ch0 .hero'));
    hero?.style.setProperty('--out', String(Math.min(1, f).toFixed(3)));
  }, []);

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); });
    };
    const ro = new ResizeObserver(() => { measure(); update(); });
    if (rootRef.current) ro.observe(rootRef.current);
    measure();
    update();
    import('../scene/gsScene.js')
      .then((m) => {
        if (disposed || !stageRef.current) return;
        // "Signal acquired." appears when the downlink touches the ground station.
        sceneRef.current = m.mountScene(stageRef.current, { dishUrl, satUrl, offset: true, onReady: bootDone, onAcquire: (on) => document.getElementById('ch4')?.classList.toggle('acquired', on) });
        if (new URLSearchParams(location.search).has('perf')) (window as unknown as { __scene: GSScene }).__scene = sceneRef.current;
        sceneRef.current.setProgress(progress.current);
      })
      .catch((e) => {
        console.error('scene', e);
        bootDone();
        document.getElementById('ch4')?.classList.add('acquired');
      });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [measure, update]);

  // The pop-up covers the stage, so stop rendering the 3D scene behind it.
  useEffect(() => {
    sceneRef.current?.setPaused(!!modal);
  }, [modal]);

  useEffect(() => onChapter(ci), [ci, onChapter]);

  const close = useCallback(() => setModal(null), []);
  return (
    <section id="top" ref={rootRef} style={{ position: 'relative' }}>
      {/* Sticky 3D stage */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
        <div ref={stageRef} style={{ position: 'absolute', inset: 0 }} />
        {/* On the last chapter the scene fades into the night sky of the page below. */}
        <div className="stage-fade" style={{ opacity: ci === 6 ? 1 : 0 }} />
      </div>

      <Chapters onOpen={setModal} />

      {modal && (
        <ConsoleModal k={modal} onClose={close}>
          <ModalBody k={modal} progress={progress} chapter={ci} cs={cs} setCs={setCs} />
        </ConsoleModal>
      )}
    </section>
  );
});
