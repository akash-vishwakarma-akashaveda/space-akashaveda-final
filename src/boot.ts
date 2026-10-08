// The loader in index.html (#boot) is a frosted layer over the page. It lifts, the blur melting away into the page,
// once the page is ready to be seen: the home page when its 3D scene has both models and has drawn, a product page as
// soon as it mounts. The home page always lets its sequence finish (connecting, controlling, comprehending); the loader
// never stays longer than MAX_MS, whatever is still loading.
import { S } from './i18n';

declare global {
  interface Window {
    __bootStart?: number;
  }
}

const SEQUENCE_MS = 3000, MAX_MS = 9000;
const el = document.getElementById('boot');
el?.querySelectorAll('.bt').forEach((w, i) => { w.textContent = S.boot.words[i]; });
el?.querySelectorAll('.bi b').forEach((b) => { b.textContent = S.beatDot; });

let done = false;
export function bootDone() {
  if (done) return;
  done = true;
  const html = document.documentElement, quick = html.classList.contains('boot-quick');
  const wait = Math.max(0, (quick ? 0 : SEQUENCE_MS) - (performance.now() - (window.__bootStart ?? 0)));
  setTimeout(() => {
    html.classList.remove('booting');
    if (!el) return;
    el.classList.add('out');
    setTimeout(() => el.remove(), 1300);
  }, wait);
}

setTimeout(bootDone, MAX_MS);
