/**
 * Text split into masked pieces that rise into place one after another (see `.sw` in global.css).
 * `from` offsets the stagger when one heading is split across several calls.
 */
export function Split({ text, chars = false, from = 0 }: { text: string; chars?: boolean; from?: number }) {
  const parts = chars ? [...text] : text.split(' ');
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          <span className="sw" style={{ ['--wi' as string]: from + i }}>
            <span>{p}</span>
          </span>
          {!chars && i < parts.length - 1 ? ' ' : null}
        </span>
      ))}
    </>
  );
}

/** Mono header line: diamond · label · fading rule · right-hand tag. */
export function SecHead({ label, tag, color = 'var(--accT)', wide = false }: { label: string; tag?: string; color?: string; wide?: boolean }) {
  return (
    <div className="sec-head" style={{ color, letterSpacing: wide ? '.12em' : undefined }}>
      <span className="dia" />
      <span className="lbl">{label}</span>
      <span className="rule" />
      {tag && <span className="tag">{tag}</span>}
    </div>
  );
}

/** Questions and answers, each opening in place. The same items are published as FAQ structured data. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="faq">
      {items.map((f) => (
        <details key={f.q} className="spot" data-reveal>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export const padX = 'clamp(20px,4vw,48px)';
