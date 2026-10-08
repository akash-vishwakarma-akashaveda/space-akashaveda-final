import { reducedMotion } from './quality.js';

// Night sky behind the lower page, continuing the 3D scene's starfield: fine stars only, drifting with scroll.
// The canvas only repaints at 30 fps.
const FRAME_MS = 1000 / 30;

export function mountSpace(el) {
  const c = document.createElement('canvas'); c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  el.appendChild(c); const x = c.getContext('2d');
  let W = 0, H = 0, lastY = -1, raf, vis = true;
  const dpr = Math.min(1.5, devicePixelRatio || 1), rnd = (a, b) => a + Math.random() * (b - a);
  const stars = Array.from({ length: 420 }, () => ({ x: Math.random(), y: Math.random(), z: rnd(.2, 1), r: rnd(.45, 1.15), tw: rnd(0, 6) }));
  const size = () => { W = el.clientWidth; H = el.clientHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); lastY = -1; };
  size(); const ro = new ResizeObserver(size); ro.observe(el);
  const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; }); io.observe(el);
  const calm = reducedMotion();
  let t = 0, last = performance.now();
  const loop = now => {
    raf = requestAnimationFrame(loop); if (!vis || now - last < FRAME_MS - 2) return;
    // With reduced motion the stars only move with scroll, so skip frames where nothing changed.
    if (calm && window.scrollY === lastY) return;
    t += calm ? 0 : Math.min(.1, (now - last) / 1000); last = now; lastY = window.scrollY;
    const sy = window.scrollY * .00008;
    x.clearRect(0, 0, W, H);
    for (const s of stars) {
      const yy = ((s.y - sy * s.z) % 1 + 1) % 1;
      x.fillStyle = `rgba(247,243,234,${(.35 + .55 * s.z) * (.75 + .25 * Math.sin(t * 1.2 + s.tw))})`;
      x.beginPath(); x.arc(s.x * W, yy * H, s.r, 0, 6.28); x.fill();
    }
  };
  raf = requestAnimationFrame(loop);
  return { dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); el.innerHTML = ''; } };
}
