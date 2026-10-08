import { useEffect, type RefObject } from 'react';

const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Counts the first number in an element's text up from zero, keeping its prefix, suffix and decimals. */
function countUp(el: HTMLElement) {
  const text = (el.dataset.text ??= el.textContent ?? '');
  const m = text.match(/\d[\d,]*(\.\d+)?/);
  if (!m || calm()) return;
  const target = parseFloat(m[0].replace(/,/g, '')), dec = m[1] ? m[1].length - 1 : 0, start = performance.now();
  const fmt = (v: number) => text.replace(m[0], v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }));
  const step = (now: number) => {
    const k = Math.min(1, (now - start) / 1400);
    el.textContent = fmt(target * (1 - (1 - k) ** 3));
    if (k < 1 && el.classList.contains('counting')) requestAnimationFrame(step);
    else el.textContent = text;
  };
  el.classList.add('counting');
  requestAnimationFrame(step);
}

/**
 * Toggles `.in` on each `[data-reveal]` inside `root` as it enters and leaves the view, both ways, so the
 * animation replays when you scroll back. `data-from` records which edge it left by ("above" or "below"),
 * so CSS can bring it back in from that side. `[data-count]` inside a revealed element counts its number up.
 */
export function useReveal(root: RefObject<HTMLElement>) {
  useEffect(() => {
    const els = root.current?.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!els?.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        const el = e.target as HTMLElement;
        const counters = el.querySelectorAll<HTMLElement>('[data-count]');
        if (e.isIntersecting) {
          el.classList.add('in');
          counters.forEach(countUp);
        } else {
          el.classList.remove('in');
          counters.forEach((c) => c.classList.remove('counting'));
          el.dataset.from = e.boundingClientRect.top < (e.rootBounds?.top ?? 0) ? 'above' : 'below';
        }
      }),
      { rootMargin: '-6% 0px -10% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [root]);
}

/** Feeds the cursor position to `.spot` elements (a glow that follows the pointer, drawn in CSS). */
export function useSpotlight() {
  useEffect(() => {
    if (!matchMedia('(hover: hover)').matches) return;
    const on = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('.spot');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    window.addEventListener('pointermove', on, { passive: true });
    return () => window.removeEventListener('pointermove', on);
  }, []);
}
