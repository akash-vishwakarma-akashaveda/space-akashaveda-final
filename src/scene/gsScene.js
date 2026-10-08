import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { axleDish, createLoader, prepareSatellite } from './loaders.js';
import { detectQuality, reducedMotion } from './quality.js';

const TM = 0xc9a24b, TC = 0x7fa3d6, RISK = 0xff3b5c, OK = 0x34d399;
const PED_H = 9.2, D2R = Math.PI / 180, EL_MIN = 16 * D2R; // elevation mask: below this the dish would foul its pedestal
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const band = (p, a, b, f = .04) => clamp((p - a) / f) * (1 - clamp((p - b) / f));
const wrap = x => ((x % 1) + 1) % 1;
const V = (x, y, z) => new T.Vector3(x, y, z);

const THEMES = {
  dark: { top: 0x050b16, mid: 0x0f1e36, hor: 0x34507c, fog: 0x0f1e36, fogD: .0016, sun: 0xfff4e0, sunI: 2.4, sunPos: [140, 120, 160], hemiS: 0xb8c4d6, hemiG: 0x141c2a, hemiI: 1.0, stars: .9, exp: 1.1, ground: 0x2e3036, hill: 0x111a2a, add: true },
  light: { top: 0x4f7bb3, mid: 0xa7c1de, hor: 0xe9edf0, fog: 0xdfe6ee, fogD: .0006, sun: 0xfff1de, sunI: 3.4, sunPos: [-140, 110, 150], hemiS: 0xcfe0f2, hemiG: 0x6b5f4c, hemiI: .55, stars: 0, exp: 1.0, ground: 0xa39a86, hill: 0x7f8c72, add: false },
};

function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }
const glowTex = () => canvasTex(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });

function label(el, text, color) {
  const d = document.createElement('div');
  d.style.cssText = `position:absolute;left:0;top:0;pointer-events:none;white-space:nowrap;font:500 11px/1 'JetBrains Mono',monospace;letter-spacing:.06em;padding:6px 9px;border:1px solid ${color};color:#fff;background:rgba(15, 30, 54,.72);backdrop-filter:blur(6px);opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s;will-change:transform`;
  d.innerHTML = text; el.appendChild(d); return d;
}

export function mountScene(el, opts = {}) {
  let theme = opts.theme || 'dark';
  const low = (opts.quality || detectQuality()) === 'low', calm = reducedMotion();
  const renderer = new T.WebGLRenderer({ antialias: !low, powerPreference: 'high-performance' });
  // Quality ladder the governor steps down when frames run long: [pixel ratio, shadows].
  const LADDER = [[Math.min(1.5, window.devicePixelRatio || 1), true], [1, true], [1, false], [.75, false]];
  let rung = low ? 2 : 0;
  renderer.setPixelRatio(LADDER[rung][0]);
  renderer.setSize(el.clientWidth, el.clientHeight);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = LADDER[rung][1]; renderer.shadowMap.type = T.PCFSoftShadowMap;
  // The scene is static apart from the antenna, so the shadow map is only redrawn when it moves.
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  el.appendChild(renderer.domElement);

  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x0f1e36, .0016);
  const camera = new T.PerspectiveCamera(50, el.clientWidth / el.clientHeight, .5, 14000);

  const skyMat = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new T.Color() }, mid: { value: new T.Color() }, hor: { value: new T.Color() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 hor; varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(hor, mid, smoothstep(-.02,.22,h)); c = mix(c, top, smoothstep(.22,.8,h)); gl_FragColor = vec4(c,1.); }'
  });
  const sky = new T.Mesh(new T.SphereGeometry(10000, 48, 24), skyMat); scene.add(sky);
  const pmrem = new T.PMREMGenerator(renderer);
  const envScene = new T.Scene(); const envSky = new T.Mesh(new T.SphereGeometry(100, 32, 16), skyMat); envScene.add(envSky);
  const envSun = new T.Mesh(new T.SphereGeometry(8, 16, 8), new T.MeshBasicMaterial({ color: 0xffffff })); envScene.add(envSun);
  let envRT = null;

  const starGeo = new T.BufferGeometry(); { const n = low ? 1800 : 3500, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const th = Math.random() * Math.PI * 2, ph = Math.acos(1 - (Math.random() * .92 + .06)); a.set([Math.sin(ph) * Math.cos(th) * 9000, Math.cos(ph) * 9000 - 300, Math.sin(ph) * Math.sin(th) * 9000], i * 3); } starGeo.setAttribute('position', new T.BufferAttribute(a, 3)); }
  const starMat = new T.PointsMaterial({ color: 0xf7f3ea, size: 1.4, sizeAttenuation: false, fog: false, transparent: true });
  scene.add(new T.Points(starGeo, starMat));

  const hemi = new T.HemisphereLight(0xffffff, 0x222222, .6); scene.add(hemi);
  const sun = new T.DirectionalLight(0xffffff, 2); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 600 }); sun.shadow.bias = -.0005; scene.add(sun, sun.target);

  // ground
  const gTex = canvasTex(512, 512, (x, w) => { x.fillStyle = '#777'; x.fillRect(0, 0, w, w); for (let i = 0; i < 12000; i++) { const s = 90 + Math.random() * 90 | 0; x.fillStyle = `rgba(${s},${s},${s},.35)`; x.fillRect(Math.random() * w, Math.random() * w, 2, 2); } });
  gTex.wrapS = gTex.wrapT = T.RepeatWrapping; gTex.repeat.set(260, 260);
  const groundMat = new T.MeshStandardMaterial({ map: gTex, roughness: 1 });
  const ground = new T.Mesh(new T.SphereGeometry(7000, 96, 48), groundMat); ground.position.y = -7000; ground.receiveShadow = true; scene.add(ground);
  const hillMat = new T.MeshStandardMaterial({ roughness: 1, flatShading: true });
  for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2 + Math.random() * .2, r = 900 + Math.random() * 700, h = new T.Mesh(new T.IcosahedronGeometry(1, 1), hillMat); h.scale.set(200 + Math.random() * 260, 45 + Math.random() * 80, 180 + Math.random() * 220); h.position.set(Math.cos(a) * r, -35, Math.sin(a) * r); scene.add(h); }
  const concrete = new T.MeshStandardMaterial({ color: 0x9a9ca0, roughness: .92 });
  const pad = new T.Mesh(new T.CylinderGeometry(24, 24, .4, 72), concrete); pad.position.y = .2; pad.receiveShadow = true; scene.add(pad);
  const road = new T.Mesh(new T.PlaneGeometry(6, 160), new T.MeshStandardMaterial({ color: 0x55575b, roughness: .95 })); road.rotation.x = -Math.PI / 2; road.rotation.z = Math.PI / 4; road.position.set(-60, .05, 60); road.receiveShadow = true; scene.add(road);

  const paint = new T.MeshStandardMaterial({ color: 0xe9ebee, roughness: .5, metalness: .2 });
  const box = (w, h, d, mat, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
  box(10, 4, 5, paint, -30, 2, -12);
  box(3, 2.4, 3, new T.MeshStandardMaterial({ color: 0x8a9096, roughness: .6, metalness: .5 }), -22, 1.2, -14);
  const lampMat = new T.MeshBasicMaterial({ color: 0xffe2b8 });
  const lamp = new T.Mesh(new T.BoxGeometry(.6, .3, .1), lampMat); lamp.position.set(-30, 3.2, -9.45); scene.add(lamp);
  const flood = new T.PointLight(0xffd7a8, 0, 40, 2); flood.position.set(-30, 4, -8); scene.add(flood);
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, post = new T.Mesh(new T.CylinderGeometry(.08, .08, 2.2, 6), concrete); post.position.set(Math.cos(a) * 42, 1.1, Math.sin(a) * 42); scene.add(post); }

  // antenna (NASA 70 m DSN model, normalised)
  const antenna = new T.Group(); scene.add(antenna);
  const pedM = new T.MeshStandardMaterial({ color: 0xa8a9ab, roughness: .85 });
  const ped = new T.Mesh(new T.CylinderGeometry(6.5, 7.2, PED_H, 48), pedM); ped.position.y = PED_H / 2; ped.castShadow = ped.receiveShadow = true; scene.add(ped);
  const plinth = new T.Mesh(new T.CylinderGeometry(9.5, 9.5, .7, 64), concrete); plinth.position.y = .35; plinth.receiveShadow = true; scene.add(plinth);
  const door = new T.Mesh(new T.BoxGeometry(1.2, 2.2, .1), new T.MeshStandardMaterial({ color: 0x3a3c40, roughness: .6 })); door.position.set(0, 1.1, 6.6); scene.add(door);
  // Azimuth turns `antenna` (with its yoke); elevation tilts `reflector`, the whole dish, about its axle (local x).
  const reflector = new T.Group(); antenna.add(reflector);
  const feed = V(0, 22, 0); let axleY = 16, satName = 'SAT-01';
  const loader = createLoader();
  loader.load(opts.dishUrl, g => {
    const { geometry, axleY: ay } = axleDish(g.scene, 30, PED_H);
    const mat = new T.MeshStandardMaterial({ color: 0xdcdfe3, roughness: .55, metalness: .1, envMapIntensity: .9, side: T.DoubleSide });
    const dish = new T.Mesh(geometry, mat); dish.castShadow = dish.receiveShadow = true;
    axleY = ay; reflector.position.y = axleY; reflector.add(dish);
    [-5.2, 5.2].forEach(x => { const arm = new T.Mesh(new T.BoxGeometry(1.1, axleY - PED_H + 1.2, 3.4), pedM); arm.position.set(x, (axleY + PED_H) / 2 + .3, 0); arm.castShadow = arm.receiveShadow = true; antenna.add(arm); });
    // Feed point on the boresight, in reflector space.
    feed.set(0, (geometry.boundingBox.max.y + axleY) * .84 - axleY, 0);
    renderer.shadowMap.needsUpdate = true; modelLoaded();
  }, undefined, e => console.warn('dish', e));

  // mission control centre (enterable)
  const MCS = V(-130, 0, 130);
  const mcs = new T.Group(); mcs.position.copy(MCS); scene.add(mcs);
  const mb = (w, h, d, mat, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; mcs.add(m); return m; };
  const wallIn = new T.MeshStandardMaterial({ color: 0x1b2d4f, roughness: .9 });
  const floorM = new T.MeshStandardMaterial({ color: 0x1d2534, roughness: .6, metalness: .2 });
  const mull = new T.MeshStandardMaterial({ color: 0x2a2c33, roughness: .5, metalness: .6 });
  mb(44, .2, 22, floorM, 0, .1, 0);
  mb(44, 12, .4, paint, 0, 6, -11); mb(.4, 12, 22, paint, -22, 6, 0); mb(.4, 12, 22, paint, 22, 6, 0);
  mb(43.2, 11.6, .1, wallIn, 0, 6, -10.75); mb(.1, 11.6, 21.2, wallIn, -21.75, 6, 0); mb(.1, 11.6, 21.2, wallIn, 21.75, 6, 0);
  const facade = new T.MeshStandardMaterial({ color: 0xcfd1d4, roughness: .75, metalness: .05 });
  const alu = new T.MeshStandardMaterial({ color: 0x8e9299, roughness: .35, metalness: .85 });
  mb(46, 1.1, 24, facade, 0, 12.55, 0);
  mb(46.4, .25, 24.4, alu, 0, 13.2, 0);
  mb(48, .35, 6, facade, 0, 10.9, 13.6);
  [-18, -6, 6, 18].forEach(x => mb(.5, 10.7, .5, alu, x, 5.35, 16.2));
  for (let i = -21; i <= 21; i += 1.4) mb(.18, 11.4, .9, facade, -22.5, 6, i * .5);
  for (let i = -21; i <= 21; i += 1.4) mb(.18, 11.4, .9, facade, 22.5, 6, i * .5);
  mb(14, 2.6, 8, facade, 12, 14.6, -4);
  for (let i = 0; i < 6; i++) { const f = new T.Mesh(new T.CylinderGeometry(.9, .9, .5, 24), alu); f.position.set(7 + (i % 3) * 3.4, 16.2, -6 + Math.floor(i / 3) * 3.6); mcs.add(f); }
  const radome = new T.Mesh(new T.SphereGeometry(2.6, 40, 20, 0, Math.PI * 2, 0, Math.PI * .62), new T.MeshStandardMaterial({ color: 0xf2f2ef, roughness: .6 })); radome.position.set(-14, 16.4, -5); radome.castShadow = true; mcs.add(radome);
  mb(3.2, 2.4, 3.2, facade, -14, 14.4, -5);
  const mast = new T.Mesh(new T.CylinderGeometry(.08, .12, 7, 8), alu); mast.position.set(-4, 16.7, -8); mcs.add(mast);
  const beacon = new T.Mesh(new T.SphereGeometry(.18, 12, 8), new T.MeshBasicMaterial({ color: 0xff4d6a })); beacon.position.set(-4, 20.3, -8); mcs.add(beacon);
  const lot = new T.Mesh(new T.PlaneGeometry(40, 16), new T.MeshStandardMaterial({ color: 0x4d4f53, roughness: .95 })); lot.rotation.x = -Math.PI / 2; lot.position.set(0, .06, 26); lot.receiveShadow = true; mcs.add(lot);
  const lineM = new T.MeshBasicMaterial({ color: 0xd8d8d8 });
  for (let i = -18; i <= 18; i += 3) { const l = new T.Mesh(new T.PlaneGeometry(.12, 4.5), lineM); l.rotation.x = -Math.PI / 2; l.position.set(i, .08, 29); mcs.add(l); }
  const carM = [0x2b2d33, 0xb9bcc2, 0x5a2f2f, 0x1f3550].map(c => new T.MeshStandardMaterial({ color: c, roughness: .3, metalness: .7 }));
  [-15, -9, -3, 6, 12].forEach((x, i) => { mb(2.1, .9, 4.2, carM[i % 4], x + 1.5, .65, 29); mb(1.8, .7, 2.2, carM[i % 4], x + 1.5, 1.4, 29.2); });
  const treeM = new T.MeshStandardMaterial({ color: 0x3d5a3a, roughness: 1, flatShading: true });
  [[-30, 8], [-32, -6], [30, 10], [33, -4], [-26, 22], [28, 24]].forEach(([x, z]) => { const tr = new T.Mesh(new T.IcosahedronGeometry(2.4, 1), treeM); tr.position.set(x, 3.4, z); tr.scale.y = 1.3; tr.castShadow = true; mcs.add(tr); mb(.35, 2, .35, alu, x, 1, z); });
  const glassM = new T.MeshStandardMaterial({ color: 0x6f7d92, transparent: true, opacity: .3, roughness: .02, metalness: 1, envMapIntensity: 1.6, depthWrite: false });
  const glassF = new T.Mesh(new T.BoxGeometry(44, 12, .12), glassM); glassF.position.set(0, 6, 11); mcs.add(glassF);
  for (let i = -22; i <= 22; i += 4) mb(.25, 12, .3, mull, i, 6, 11);
  const stripM = new T.MeshBasicMaterial({ color: 0xf7f3ea });
  [-6, 0, 6].forEach(z => mb(30, .05, .3, stripM, 0, 11.9, z));
  const deskM = new T.MeshStandardMaterial({ color: 0x2c2a36, roughness: .5, metalness: .3 });
  const topM = new T.MeshStandardMaterial({ color: 0x14121c, roughness: .3, metalness: .4 });
  const chairM = new T.MeshStandardMaterial({ color: 0x0f0e14, roughness: .7 });
  const scr = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4; return { c, x: c.getContext('2d'), tex, w, h }; };
  const sMCS = scr(1536, 488), sGS = scr(768, 538), sSSA = scr(512, 512), sRTh = scr(704, 44);
  const wallMats = new Map();
  const wallMat = (tex, transparent) => { if (!wallMats.has(tex)) wallMats.set(tex, new T.MeshBasicMaterial({ map: tex, fog: false, transparent, toneMapped: false })); return wallMats.get(tex); };
  const wall = (tex, w, h, x, y, z, ry = 0, transparent = false) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), wallMat(tex, transparent)); m.position.set(x, y, z); m.rotation.y = ry; mcs.add(m); return m; };
  mb(23, 7.6, .15, mull, -6, 6.2, -10.62); wall(sMCS.tex, 22, 7, -6, 6.2, -10.5);
  mb(10.6, 7.6, .15, mull, 11.5, 6.2, -10.62); wall(sGS.tex, 10, 7, 11.5, 6.2, -10.5);
  const rt = low ? new T.WebGLRenderTarget(512, 326) : new T.WebGLRenderTarget(880, 560); rt.texture.colorSpace = T.SRGBColorSpace;
  const rtCam = new T.PerspectiveCamera(40, 11 / 7, .5, 14000);
  mb(.15, 7.6, 19.2, mull, 21.62, 6.2, -.8);
  wall(rt.texture, 11, 7, 21.5, 6.2, -4.5, -Math.PI / 2);
  wall(sRTh.tex, 11, .7, 21.45, 9.35, -4.5, -Math.PI / 2, true);
  wall(sSSA.tex, 7, 7, 21.5, 6.2, 4.6, -Math.PI / 2);
  [0.5, 5.5].forEach((z, r) => {
    mb(32, 1.3, 1.3, deskM, 0, .75, z); mb(32.4, .1, 1.7, topM, 0, 1.45, z + .1);
    for (let i = 0; i < 8; i++) {
      const x = -14 + i * 4;
      const mon = wall(i % 3 === 2 ? sSSA.tex : i % 3 === 1 ? sGS.tex : sMCS.tex, 2.6, 1.5, x, 2.35, z - .25);
      mb(2.7, 1.6, .06, mull, x, 2.35, z - .3); mb(.15, .6, .15, mull, x, 1.7, z - .3);
      mb(.9, .9, .9, chairM, x, .75, z + 1.7); mb(.9, 1.2, .12, chairM, x, 1.6, z + 2.1);
    }
  });
  const roomLs = [[-10, 10, 2], [10, 10, 2], [0, 9, 8]].map(pp => { const l = new T.PointLight(0xfff4e0, 90, 34, 1.4); l.position.set(...pp); mcs.add(l); return l; });
  const wallGlow = new T.PointLight(0xc9a24b, 60, 20, 2); wallGlow.position.set(-4, 6, -7); mcs.add(wallGlow);
  const mcsLight = new T.PointLight(0xc9a24b, 0, 90, 2); mcsLight.position.set(0, 7, 24); mcs.add(mcsLight);

  const C = { bg: '#0f1e36', bar: '#1b2d4f', line: 'rgba(247, 243, 234,.14)', ink: '#f7f3ea', mute: '#8c97aa', acc: '#c9a24b', accT: '#c9a24b', tc: '#7fa3d6', ok: '#34d399', risk: '#ff4d6a', warn: '#f5a524' };
  const mono = n => n + 'px "JetBrains Mono", ui-monospace, monospace';
  const head = (S, title, right, col, rc) => { const x = S.x; x.fillStyle = C.bg; x.fillRect(0, 0, S.w, S.h); x.fillStyle = C.bar; x.fillRect(0, 0, S.w, 44); x.fillStyle = col; x.fillRect(16, 16, 12, 12); x.fillStyle = C.ink; x.font = mono(17); x.textBaseline = 'alphabetic'; x.fillText(title, 40, 28); if (right) { x.fillStyle = rc || C.ok; x.textAlign = 'right'; x.fillText(right, S.w - 16, 28); x.textAlign = 'left'; } };
  const txt = (x, s, X, Y, col, n = 14, al = 'left') => { x.fillStyle = col; x.font = mono(n); x.textAlign = al; x.fillText(s, X, Y); x.textAlign = 'left'; };
  const chart = (x, X, Y, W, H, tt, fr, k, col, lab, val) => { x.strokeStyle = C.line; x.lineWidth = 1; x.strokeRect(X, Y, W, H); txt(x, lab, X, Y - 9, C.mute, 14); txt(x, val, X + W, Y - 9, col, 14, 'right'); x.beginPath(); for (let i = 0; i <= 80; i++) { const v = Math.sin((i + tt * 8) * fr + k) * .6 + Math.sin((i + tt * 8) * fr * 2.7 + k) * .4; const px = X + i / 80 * W, py = Y + H / 2 - v * H * .36; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.strokeStyle = col; x.lineWidth = 2; x.stroke(); x.lineWidth = 1; };
  const boxR = (x, X, Y, W, H, bd) => { x.strokeStyle = bd; x.lineWidth = 1.5; x.strokeRect(X, Y, W, H); x.lineWidth = 1; };
  function drawScreens(tt, p) {
    const approved = p > .64, sent = p > .84, x = sMCS.x;
    head(sMCS, 'VYUH MCS  ·  ' + satName + '  ·  PASS 0412  ·  GS-01', '● IN CONTACT  LOS 0' + (8 - Math.floor(p * 6)) + ':' + String(59 - Math.floor(tt) % 60).padStart(2, '0'), C.acc);
    txt(x, 'TELEMETRY · LIVE', 24, 76, C.mute, 13);
    chart(x, 24, 112, 560, 86, tt, .35, 0, C.accT, 'BATT_BUS_V', (28.1 + Math.sin(tt) * .15).toFixed(2) + ' V');
    chart(x, 24, 240, 560, 86, tt, .18, 2, C.tc, 'OBC_TEMP', (23.4 + Math.sin(tt * .7) * .6).toFixed(1) + ' °C');
    chart(x, 24, 368, 560, 86, tt, .6, 4, C.ok, 'RX_RSSI', (-92 + Math.sin(tt * 1.3) * 1.5).toFixed(1) + ' dBm');
    txt(x, 'COMMAND QUEUE · DUAL AUTHORISATION', 624, 76, C.mute, 13);
    const cmds = [
      ...(sent ? [['TC-0419', 'MANOEUVRE Δv 0.12 m/s · FROM CHAKRA', 'PENDING 0/2', C.warn, C.acc]] : []),
      ['TC-0412', 'SET_PAYLOAD_MODE → IMAGING', approved ? 'RELEASED' : 'PENDING 1/2', approved ? C.ok : C.warn, approved ? C.line : C.acc],
      ['TC-0411', 'DOWNLOAD_STORE · SEG 14–22', 'EXECUTED', C.ok, C.line]
    ].slice(0, 3);
    cmds.forEach((c, i) => { const Y = 92 + i * 118; boxR(x, 624, Y, 470, 104, c[4]); txt(x, c[0], 642, Y + 32, C.ink, 17); txt(x, c[2], 1078, Y + 32, c[3], 15, 'right'); txt(x, c[1], 642, Y + 62, C.ink, 15); txt(x, i === 0 && sent ? 'SOURCE CHAKRA · AWAITING OPERATOR A' : 'OPERATOR A ✓ · OPERATOR B ' + (c[2] === 'PENDING 1/2' ? 'PENDING' : '✓'), 642, Y + 88, C.mute, 12); });
    txt(x, 'CONSTELLATION · 6 SPACECRAFT · 2 PLANES', 1130, 76, C.mute, 13);
    // The satellite in contact is the one being followed; it swaps places with SAT-01 in the list.
    [['SAT-01', 'P1', 'IN CONTACT · CJ-2031', C.ok], ['SAT-02', 'P1', 'NEXT PASS 02:14', C.mute], ['SAT-03', 'P1', 'NOMINAL', C.accT], ['SAT-04', 'P2', 'THERMAL WATCH', C.warn], ['SAT-05', 'P2', 'NOMINAL', C.accT], ['SAT-06', 'P2', 'NEXT PASS 05:40', C.mute]].map(f => [f[0] === satName ? 'SAT-01' : f[0] === 'SAT-01' ? satName : f[0], ...f.slice(1)]).forEach((f, i) => { const Y = 94 + i * 36; x.fillStyle = f[3]; x.beginPath(); x.arc(1138, Y + 10, 5, 0, 7); x.fill(); txt(x, f[0], 1152, Y + 15, C.ink, 14); txt(x, f[1], 1236, Y + 15, C.mute, 13); txt(x, f[2], 1512, Y + 15, f[3], 13, 'right'); });
    txt(x, 'AUDIT TRAIL', 1130, 332, C.mute, 13);
    [...(sent ? [['T+04', 'CJ-2031 option A → Vyuh']] : []), ...(approved ? [['T+03', 'TC-0412 released to GS-01']] : []), ['T+02', 'TC-0412 approved · Op A'], ['T+01', 'TC-0411 executed · verified'], ['T+00', 'AOS · TM lock acquired']].slice(0, 4).forEach((a, i) => { txt(x, a[0], 1130, 364 + i * 30, C.mute, 13); txt(x, a[1], 1190, 364 + i * 30, C.ink, 14); });
    const g = sGS.x; head(sGS, 'GS-01 · GROUND ANTENNA', 'AUTOTRACK', C.acc, C.accT);
    const cx = 220, cy = 300, R = 190; g.strokeStyle = C.line; [1, .66, .33].forEach(k => { g.beginPath(); g.arc(cx, cy, R * k, 0, Math.PI * 2); g.stroke(); }); g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
    txt(g, 'N', cx, cy - R - 8, C.mute, 13, 'center');
    g.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, a = Math.PI * (1.1 + .9 * u), r = R * (1 - Math.sin(Math.PI * u) * .82); const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.strokeStyle = C.accT; g.lineWidth = 2; g.setLineDash([6, 5]); g.stroke(); g.setLineDash([]); g.lineWidth = 1;
    const u = .28 + .42 * p, a = Math.PI * (1.1 + .9 * u), r = R * (1 - Math.sin(Math.PI * u) * .82); g.fillStyle = C.ink; g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 7, 0, Math.PI * 2); g.fill();
    const el = Math.max(0, 90 * Math.sin(Math.PI * u) * .92), az = (210 + p * 110) % 360;
    [['AZIMUTH', az.toFixed(1) + '°', C.ink], ['ELEVATION', el.toFixed(1) + '°', C.ink], ['TM ↓ RX', 'LOCKED', C.accT], ['TC ↑ TX', p > .88 ? 'UPLINK' : 'ACTIVE', C.tc], ['EB/N0', (11.8 + Math.sin(tt) * .6).toFixed(1) + ' dB', C.ok]].forEach((k, i) => { txt(g, k[0], 460, 96 + i * 86, C.mute, 13); txt(g, k[1], 460, 128 + i * 86, k[2], 26); });
    const q = sSSA.x; head(sSSA, 'CHAKRA SSA', sent ? 'RESOLVED' : 'REVIEW', C.risk, sent ? C.ok : C.warn);
    [['CJ-2031', 'DEB-48213', '2.1e-4', 'HIGH', C.risk], ['CJ-2033', 'OBJ-39087', '4.0e-5', 'MED', C.warn], ['CJ-2032', 'SAT-27711', '3.0e-6', 'LOW', C.ok]].forEach((e, i) => { const Y = 64 + i * 50; if (!i) { q.fillStyle = 'rgba(255,77,106,.12)'; q.fillRect(0, Y, 512, 46); } txt(q, e[0], 16, Y + 29, C.ink, 14); txt(q, e[1], 110, Y + 29, C.mute, 14); txt(q, e[2], 330, Y + 29, C.ink, 14); txt(q, e[3], 496, Y + 29, e[4], 14, 'right'); });
    txt(q, 'CJ-2031 · TCA T+06:42:10', 16, 250, C.mute, 13);
    txt(q, 'MISS 186 m', 16, 292, C.ink, 26); txt(q, 'Pc 2.1e-4', 16, 332, C.risk, 26);
    boxR(q, 16, 360, 480, 128, sent ? C.ok : C.warn);
    txt(q, sent ? 'OPTION A ACCEPTED' : 'RESPONSE OPTIONS', 32, 392, sent ? C.ok : C.warn, 15);
    txt(q, 'A · Avoidance burn Δv 0.12 m/s', 32, 424, C.ink, 14); txt(q, 'B · Monitor · re-screen in 6 h', 32, 452, C.mute, 14);
    if (sent) txt(q, '→ SENT TO VYUH FOR APPROVAL', 32, 478, C.ok, 13);
    const h = sRTh.x; h.clearRect(0, 0, 704, 44); h.fillStyle = 'rgba(15, 30, 54,.8)'; h.fillRect(0, 0, 704, 44); h.fillStyle = C.risk; h.fillRect(14, 16, 12, 12); txt(h, 'LIVE ORBIT VIEW · ' + satName + ' × DEB-48213', 36, 28, C.ink, 16);
    [sMCS, sGS, sSSA, sRTh].forEach(S => S.tex.needsUpdate = true);
  }
  drawScreens(0, 0);
  let lastDraw = -1;

  const fibre = new T.CatmullRomCurve3([V(-26, .5, -9.4), V(-40, .5, 20), V(-70, .5, 70), V(-105, .5, 110), V(-124, .5, 118)]);
  const fibreMat = new T.MeshBasicMaterial({ color: TM, transparent: true, opacity: .3 });
  scene.add(new T.Mesh(new T.TubeGeometry(fibre, 140, .22, 6), fibreMat));

  const gT = glowTex();
  // satellite (NASA Landsat 8 model, normalised)
  const sat = new T.Group(); scene.add(sat);
  const satBody = new T.Group(); sat.add(satBody);
  loader.load(opts.satUrl, g => {
    const m = g.scene; prepareSatellite(m); const b = new T.Box3().setFromObject(m), s = new T.Vector3(); b.getSize(s);
    m.scale.setScalar(26 / Math.max(s.x, s.y, s.z)); b.setFromObject(m); const c = new T.Vector3(); b.getCenter(c); m.position.sub(c);
    satBody.add(m);
    PASSES.slice(0, low ? 2 : PASSES.length).forEach((a, i) => {
      const g = new T.Group(), body = m.clone(); g.add(body);
      const glow = new T.Sprite(new T.SpriteMaterial({ map: gT, color: 0xfff2d6, transparent: true, opacity: .3, depthWrite: false, fog: false })); glow.scale.setScalar(120); g.add(glow);
      g.visible = false; scene.add(g);
      // A short trail fading out behind the satellite (vertex alpha: clear at the tail, brightest at the satellite).
      const trailGeo = new T.BufferGeometry();
      trailGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(TRAIL_N * 3), 3));
      trailGeo.setAttribute('color', new T.BufferAttribute(Float32Array.from({ length: TRAIL_N * 4 }, (_, j) => (j % 4 === 3 ? .6 * ((j >> 2) / (TRAIL_N - 1)) ** 1.6 : 1)), 4));
      const trail = new T.Line(trailGeo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, fog: false }));
      trail.frustumCulled = false; trail.visible = false; scene.add(trail);
      fleet.push({ a, g, body, glow, trail, name: 'SAT-0' + (i + 1), u: 0, on: false, k: body.scale.x });
    });
    modelLoaded();
  }, undefined, e => console.warn('sat', e));
  const satGlow = new T.Sprite(new T.SpriteMaterial({ map: gT, color: 0xfff2d6, blending: T.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); sat.add(satGlow);
  const satKey = new T.PointLight(0xffffff, 0, 120, 2); satKey.position.set(22, 18, 30); sat.add(satKey);
  const satPos = s => V(-380 + 760 * s, 60 + 180 * Math.sin(Math.PI * s), -120);

  // Hero constellation: real LEO passes over GS-01. Each satellite flies a circular orbit ALT km up; a pass is set by
  // the azimuth A and elevation E (degrees) of its closest approach, flying left to right across the hero camera.
  // It runs AOS to LOS where it crosses the elevation mask, at true orbital speed sped up TIME_SCALE times, and is
  // drawn in its true direction from the station at SKY_D. The hero frame is narrower than a real pass, so some
  // passes enter or leave across its edges; all of them stay clear of the headline. Each pass's AOS comes as the
  // one before it is three quarters done, so GS-01 always has a satellite to hand over to.
  const RE = 6371, ALT = 550, ORB_R = RE + ALT, MU = 398600, TIME_SCALE = 10, SKY_D = 2200, EARTH_C = V(0, -RE, 0);
  const PASSES = [{ A: 246, E: 38 }, { A: 170, E: 37 }, { A: 176, E: 32 }];
  const FLEET_SCALE = 3.5, HERO_POS = V(80, 10, 109), HERO_TGT = V(-30, 79, -50);
  let PERIOD = 0;
  PASSES.forEach(ps => {
    const A = ps.A * D2R, E = ps.E * D2R, down = EARTH_C.clone().normalize().negate();
    // Closest approach: slant range along (A, E) to the orbit sphere; the track crosses that vertical plane at right angles.
    const rho = -RE * Math.sin(E) + Math.sqrt((RE * Math.sin(E)) ** 2 + ORB_R ** 2 - RE ** 2);
    ps.a = V(Math.cos(E) * Math.sin(A), Math.sin(E), Math.cos(E) * Math.cos(A)).multiplyScalar(rho).sub(EARTH_C).normalize();
    ps.b = ps.a.clone().cross(down).normalize();
    const el = phi => { const v = EARTH_C.clone().addScaledVector(ps.a, ORB_R * Math.cos(phi)).addScaledVector(ps.b, ORB_R * Math.sin(phi)); return Math.asin(v.y / v.length()); };
    let lo = 0, hi = Math.PI / 2;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (el(m) > EL_MIN) lo = m; else hi = m; }
    ps.phi = lo; ps.T = 2 * lo * Math.sqrt(ORB_R ** 3 / MU) / TIME_SCALE;
  });
  // Longest pass first: every load opens on it, already a little past AOS.
  // Each pass's AOS comes as the one before it is three quarters done; the cycle closes when the last one sets,
  // so a load (t = 0) opens on the longest pass alone, coming in from the corner of the sky.
  PASSES.sort((p, q) => q.T - p.T).forEach(ps => { ps.t0 = PERIOD; PERIOD += ps.T * .75; });
  PERIOD = PASSES[PASSES.length - 1].t0 + PASSES[PASSES.length - 1].T;
  // The longest pass rises behind the top-left corner of the hero frame and comes into view about 40% of the way
  // through, so a load starts just before that: it flies in from the corner within a second or two, alone.
  const START_T = PASSES[0].T * .38;
  const TRAIL_N = 48, TRAIL_U = .14;
  function arcPos(ps, u, out) {
    const phi = ps.phi * (2 * u - 1);
    return out.copy(EARTH_C).addScaledVector(ps.a, ORB_R * Math.cos(phi)).addScaledVector(ps.b, ORB_R * Math.sin(phi)).setLength(SKY_D);
  }
  // Link plan through each pass, by fraction of the AOS-LOS window.
  const linkAt = f => (f < .08 ? 'AOS' : f < .42 ? 'TM' : f < .62 ? 'TC' : f < .93 ? 'TM' : 'LOS');
  const LINK_TEXT = { AOS: 'AOS · ACQUIRING', TM: 'TM ↓ DOWNLINK', TC: 'TC ↑ UPLINK', LOS: 'LOS' };
  const LINK_COL = { AOS: '#8a95a8', TM: '#c9a24b', TC: '#7fa3d6', LOS: '#8a95a8' };
  const fleet = []; let trk = -1;

  // beams + packets
  const beamMat = c => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, fog: false });
  const dBeam = new T.Mesh(new T.CylinderGeometry(.3, 3, 1, 40, 1, true), beamMat(TM)); scene.add(dBeam);
  const uBeam = new T.Mesh(new T.CylinderGeometry(.25, 2.6, 1, 40, 1, true), beamMat(TC)); scene.add(uBeam);
  const pk = (n, c, s) => Array.from({ length: n }, () => { const sp = new T.Sprite(new T.SpriteMaterial({ map: gT, color: c, transparent: true, depthWrite: false, fog: false })); sp.scale.setScalar(s); scene.add(sp); return sp; });
  const down = pk(26, TM, 5), up = pk(22, TC, 4.5), back = pk(18, TM, 4);
  const allPk = [...down, ...up, ...back];

  // SSA
  const ssa = new T.Group(); scene.add(ssa);
  const debMat = new T.MeshStandardMaterial({ color: 0x9a9ca4, metalness: .7, roughness: .45, flatShading: true, fog: false });
  const debris = Array.from({ length: low ? 60 : 110 }, () => { const r = 50 + Math.random() * 220, th = Math.random() * Math.PI * 2, ph = (Math.random() - .5) * 1.3; return { b: V(Math.cos(th) * r, Math.sin(ph) * r * .45, Math.sin(th) * r), size: Math.random() * 1.2 + .3, sp: 1 + Math.random() * 4, rx: Math.random(), ry: Math.random(), e: new T.Euler() }; });
  const debrisMesh = new T.InstancedMesh(new T.IcosahedronGeometry(1, 0), debMat, debris.length); debrisMesh.frustumCulled = false; ssa.add(debrisMesh);
  const dQ = new T.Quaternion(), dS = new T.Vector3(), dP = new T.Vector3(), dM = new T.Matrix4();
  const threat = new T.Mesh(new T.DodecahedronGeometry(2.4, 0), debMat); ssa.add(threat);
  const ringM = new T.MeshBasicMaterial({ color: RISK, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const ring = new T.Mesh(new T.TorusGeometry(20, .18, 8, 96), ringM); ssa.add(ring);
  const ring2 = new T.Mesh(new T.TorusGeometry(7, .14, 8, 64), ringM.clone()); ssa.add(ring2);
  const dl = c => new T.LineDashedMaterial({ color: c, dashSize: 3, gapSize: 2.2, transparent: true, opacity: 0, fog: false });
  const line = (a, b, m) => { const l = new T.Line(new T.BufferGeometry().setFromPoints([a, b]), m); l.computeLineDistances(); ssa.add(l); return l; };
  const satPath = line(V(-220, 0, 0), V(220, 0, 0), dl(TM)), newPath = line(V(-220, 0, 0), V(220, 0, 0), dl(OK));
  const thrDir = V(-.35, -.22, 1).normalize(); const thrPath = line(thrDir.clone().multiplyScalar(-240), thrDir.clone().multiplyScalar(240), dl(RISK));

  // Merge static meshes into one draw call per material and shadow flags (site, fence, building shell,
  // desks and monitors): ~350 draw calls per frame down to a few dozen.
  function mergeStatic(parent, skip) {
    const groups = new Map();
    for (const o of [...parent.children]) {
      if (!o.isMesh || o.isInstancedMesh || skip.has(o) || Array.isArray(o.material) || o.material.transparent) continue;
      const key = o.material.uuid + (o.castShadow ? ':c' : '') + (o.receiveShadow ? ':r' : '');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(o);
    }
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      const geos = list.map((o) => { o.updateMatrix(); return o.geometry.clone().applyMatrix4(o.matrix); });
      const indexed = geos.every((g) => g.index);
      const merged = mergeGeometries(indexed ? geos : geos.map((g) => (g.index ? g.toNonIndexed() : g)));
      if (!merged) continue;
      const m = new T.Mesh(merged, list[0].material);
      m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow;
      list.forEach((o) => { parent.remove(o); o.geometry.dispose(); });
      geos.forEach((g) => g.dispose());
      parent.add(m);
    }
  }
  mergeStatic(scene, new Set([sky, ground]));
  mergeStatic(mcs, new Set());

  // Compile every shader in the background once both models are in, including objects that only appear later
  // (Chakra debris, rings, beams), so reaching those chapters doesn't stall on shader compilation.
  let loaded = 0;
  function modelLoaded() {
    if (++loaded < 2) return;
    requestAnimationFrame(() => requestAnimationFrame(() => opts.onReady?.()));
    if (!renderer.compileAsync) return;
    const hidden = [];
    scene.traverse(o => { if (!o.visible) { hidden.push(o); o.visible = true; } });
    renderer.compileAsync(scene, camera).catch(() => {});
    hidden.forEach(o => { o.visible = false; });
  }

  // DOM labels
  const L = { sat: label(el, 'SAT-01 · LEO', '#c9a24b'), tm: label(el, 'TM ↓ DOWNLINK', '#c9a24b'), tc: label(el, 'TC ↑ UPLINK', '#7fa3d6'), gs: label(el, 'GS-01 · GROUND STATION', '#c9a24b'), mcs: label(el, 'VYUH MCS · OPS CENTRE', '#c9a24b'), track: label(el, '', '#c9a24b'), wallM: label(el, 'VIDEO WALL · VYUH MCS', '#c9a24b'), wallS: label(el, 'VIDEO WALL · CHAKRA SSA', '#ff3b5c') };

  const S = () => sat.position;
  const R = (x, y, z) => () => V(MCS.x + x, y, MCS.z + z);
  const KEYS = [
    { p: -.3, pos: () => HERO_POS, tgt: () => HERO_TGT },
    { p: -.2, pos: () => S().clone().add(V(18, -14, 26)), tgt: () => S().clone().add(V(-4, 4, 0)) },
    { p: -.13, pos: () => S().clone().add(V(-6, -20, 32)), tgt: () => S().clone().add(V(2, 6, 0)) },
    { p: -.06, pos: () => S().clone().add(V(-30, -26, 22)), tgt: () => S().clone().add(V(6, 6, -2)) },
    { p: .08, pos: () => V(80, 14, 110), tgt: () => tmp4.lerpVectors(feedW, S(), .6) },
    { p: .2, pos: () => V(52, 5, 58), tgt: () => V(-30, 80, -40) },
    { p: .4, pos: () => V(40, 16, 36), tgt: () => V(0, 15, 0) },
    { p: .5, pos: () => V(10, 30, 70), tgt: () => V(-70, 5, 70) },
    { p: .54, pos: R(6, 8, 52), tgt: R(0, 7, 0) },
    { p: .6, pos: R(-2, 5.4, 9.6), tgt: R(-5, 5.8, -10.5) },
    { p: .68, pos: R(0, 5.4, 8), tgt: R(-2, 5.8, -10.5) },
    { p: .8, pos: R(3, 5.4, 1), tgt: R(21.5, 6, -1.2) },
    { p: .87, pos: R(6, 5.5, 0), tgt: R(21.5, 6, -1.2) },
    { p: .94, pos: R(4, 6, 34), tgt: () => V(0, 20, 0) },
    { p: 1, pos: () => V(-60, 6, 150), tgt: () => V(-14.5, 29.5, 69.5) },
  ];

  function applyTheme(name) {
    theme = name; const th = THEMES[name] || THEMES.dark;
    skyMat.uniforms.top.value.setHex(th.top); skyMat.uniforms.mid.value.setHex(th.mid); skyMat.uniforms.hor.value.setHex(th.hor);
    scene.fog.color.setHex(th.fog); scene.fog.density = th.fogD; scene.background = new T.Color(th.hor);
    sun.color.setHex(th.sun); sun.intensity = th.sunI; sun.position.set(...th.sunPos);
    hemi.color.setHex(th.hemiS); hemi.groundColor.setHex(th.hemiG); hemi.intensity = th.hemiI;
    starMat.opacity = th.stars; starMat.visible = th.stars > 0; renderer.toneMappingExposure = th.exp;
    groundMat.color.setHex(th.ground); hillMat.color.setHex(th.hill);
    flood.intensity = name === 'dark' ? 60 : 30; mcsLight.intensity = name === 'dark' ? 140 : 50;
    envSun.position.set(...th.sunPos).normalize().multiplyScalar(80);
    if (envRT) envRT.dispose(); envRT = pmrem.fromScene(envScene, .03); scene.environment = envRT.texture;
    const blend = th.add ? T.AdditiveBlending : T.NormalBlending;
    [dBeam, uBeam].forEach(b => { b.material.blending = blend; b.material.needsUpdate = true; });
    allPk.forEach(s => { s.material.blending = blend; s.material.needsUpdate = true; });
    satGlow.material.opacity = th.add ? 1 : .0;
  }
  applyTheme(theme);

  let useOffset = opts.offset !== false, paused = false;
  let progress = -.3, sp = -.3, px = 0, py = 0, tx = 0, ty = 0, visible = true;
  let W = el.clientWidth, H = el.clientHeight;
  const onMove = e => { tx = (e.clientX / window.innerWidth) * 2 - 1; ty = (e.clientY / window.innerHeight) * 2 - 1; };
  if (!calm) window.addEventListener('pointermove', onMove, { passive: true });
  const ro = new ResizeObserver(() => { W = el.clientWidth; H = el.clientHeight; renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); }); ro.observe(el);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(el);

  const tmp = new T.Vector3(), tmp2 = new T.Vector3(), tmp3 = new T.Vector3(), pos = new T.Vector3(), tgt = new T.Vector3(), feedW = new T.Vector3(), prj = new T.Vector3(), tip = new T.Vector3(), tmp4 = new T.Vector3();
  // The downlink grows from the satellite to GS-01 over ACQ (journey progress); contact is reported to the page.
  const ACQ = [-.15, .15]; let acquired = false;
  const Y_UP = V(0, 1, 0), UP_OFF = V(1.5, 0, 1.5), RT_OFF = V(30, -8, 42);
  const AT_GS = V(0, 42, 0), AT_MCS = V(MCS.x, 20, MCS.z), AT_WALL_M = V(MCS.x - 17, 10.4, MCS.z - 10.5), AT_WALL_S = V(MCS.x + 21.5, 10.4, MCS.z - 10);
  // Labels only touch the DOM when their position or visibility actually changes.
  const place = (d, w, op, dx = 14, dy = -14) => {
    let o = 0;
    if (op) { prj.copy(w).project(camera); if (prj.z < 1 && Math.abs(prj.x) < 1.1 && Math.abs(prj.y) < 1.1) o = op; }
    if (o) {
      const w = d._w || (d._w = d.offsetWidth);
      let x = (prj.x * .5 + .5) * W + dx; const y = (-prj.y * .5 + .5) * H + dy;
      if (dx > 0 && x + w > W - 12) x -= 2 * dx + w;
      if (!(Math.abs(x - d._x) < .3 && Math.abs(y - d._y) < .3)) { d._x = x; d._y = y; d.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; }
    }
    if (o !== d._o) { d._o = o; d.style.opacity = o; d.style.visibility = o ? 'visible' : 'hidden'; }
  };
  const beamTo = (b, from, to) => { const d = tmp.subVectors(to, from), l = d.length(); b.scale.set(1, l, 1); b.position.copy(from).addScaledVector(d, .5); b.quaternion.setFromUnitVectors(Y_UP, d.normalize()); };
  const showAll = (arr, on) => { if (arr[0].visible !== on) arr.forEach(k => { k.visible = on; }); };

  // At rest (camera settled) the scene renders at 30 fps; while scrolling or following the pointer it runs at full rate.
  const IDLE_MS = 1000 / 30;
  renderer.info.autoReset = false;
  let hTM = 0, hTC = 0, link = 'AOS';
  const SAT_TAG = new T.Vector3(), TAG_UP = V(0, 15, 0);
  let t = START_T, lastRender = 0, raf, cpuAvg = 0, rtTick = 0, shadowRot = 0, shadowTick = 0, ema = 16, warm = 0;
  function setRung(r) { rung = r; renderer.setPixelRatio(LADDER[r][0]); renderer.shadowMap.enabled = LADDER[r][1]; renderer.shadowMap.needsUpdate = true; }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible || paused) { lastRender = 0; return; }
    const moving = Math.abs(progress - sp) > 5e-4 || Math.abs(tx - px) + Math.abs(ty - py) > 2e-3;
    if ((!moving || calm) && lastRender && now - lastRender < IDLE_MS - 2) return;
    const dt = lastRender ? Math.min(.1, (now - lastRender) / 1000) : 1 / 60;
    // Governor: step down the quality ladder if full-rate frames keep running long.
    if (moving && lastRender && !calm) {
      ema += (now - lastRender - ema) * .05;
      if (++warm > 90 && ema > 26 && rung < LADDER.length - 1) { setRung(rung + 1); ema = 16; warm = 0; }
    }
    lastRender = now; t += dt;
    const t0 = performance.now();
    sp += (progress - sp) * Math.min(1, dt * 2.4); const p = sp;
    px += (tx - px) * Math.min(1, dt * 2); py += (ty - py) * Math.min(1, dt * 2);
    const add = THEMES[theme].add; const inRoom = p > .55 && p < .95;

    const s = .28 + .42 * p, avoid = ease(clamp((p - .84) / .08));
    sat.position.copy(satPos(s)); sat.position.y += avoid * 12;
    tmp.copy(satPos(s + .001)).sub(satPos(s)).normalize();
    satBody.lookAt(tmp2.copy(sat.position).add(tmp)); satBody.rotateX(Math.sin(t * .25) * .04);
    rtCam.position.copy(sat.position).add(RT_OFF); rtCam.lookAt(sat.position); const camD = (inRoom ? rtCam.position : camera.position).distanceTo(sat.position);
    satGlow.scale.setScalar(clamp(camD / 18, 0, 30)); satGlow.material.opacity = add ? clamp((camD - 120) / 200) : 0;
    satKey.intensity = clamp((260 - camD) / 100) * 4000;

    // Hero: the constellation passes overhead and GS-01 tracks one satellite from AOS to LOS, then hands over.
    const hA = 1 - clamp((p + .3) / .08), hero = hA > .5;
    sat.visible = !hero;
    fleet.forEach(f => {
      f.u = wrap((t - f.a.t0) / PERIOD) * PERIOD / f.a.T; f.on = f.u < 1;
      const edge = f.on ? clamp(Math.min(f.u, 1 - f.u) / .04) : 0;
      f.g.visible = hero && edge > 0;
      f.trail.visible = f.g.visible;
      if (!f.g.visible) return;
      const tp = f.trail.geometry.attributes.position;
      for (let j = 0; j < TRAIL_N; j++) { arcPos(f.a, Math.max(0, f.u - TRAIL_U * (1 - j / (TRAIL_N - 1))), tmp3); tp.setXYZ(j, tmp3.x, tmp3.y, tmp3.z); }
      tp.needsUpdate = true;
      f.body.scale.setScalar(f.k * FLEET_SCALE * edge); f.glow.material.opacity = .3 * edge;
      arcPos(f.a, f.u, f.g.position);
      f.body.lookAt(arcPos(f.a, Math.min(1, f.u + .01), tmp2));
    });
    if (hero && (trk < 0 || !fleet[trk].on)) {
      let best = -1;
      fleet.forEach((f, i) => { if (f.on && (best < 0 || f.u < fleet[best].u)) best = i; });
      if (best >= 0) trk = best;
    }
    if (trk >= 0 && fleet[trk].name !== satName) { satName = fleet[trk].name; L.sat.textContent = satName + ' · LEO'; L.sat._w = 0; lastDraw = -1; }
    const glide = ease(clamp((p + .3) / .07));
    if (glide < 1 && trk >= 0) sat.position.lerpVectors(fleet[trk].g.position, sat.position, glide);
    satBody.scale.setScalar(trk >= 0 ? FLEET_SCALE + (1 - FLEET_SCALE) * glide : 1);
    const target = hero && trk >= 0 ? fleet[trk].g.position : sat.position;
    if (hero && trk >= 0) link = linkAt(fleet[trk].u);
    const ease3 = Math.min(1, dt * 3);
    hTM += ((hero && link === 'TM' ? 1 : 0) - hTM) * ease3; hTC += ((hero && link === 'TC' ? 1 : 0) - hTC) * ease3;

    // Antenna: azimuth on the base, elevation on the reflector, slewing the short way round.
    const az = Math.atan2(target.x, target.z), elv = clamp(Math.atan2(target.y - axleY, Math.hypot(target.x, target.z)), EL_MIN, Math.PI / 2);
    const slew = Math.min(1, dt * 1.5), dAz = ((az - antenna.rotation.y + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    antenna.rotation.y += dAz * slew;
    reflector.rotation.x += (Math.PI / 2 - elv - reflector.rotation.x) * slew;
    const aim = antenna.rotation.y + reflector.rotation.x;
    if (renderer.shadowMap.enabled && Math.abs(aim - shadowRot) > .004 && ++shadowTick % 4 === 0) { shadowRot = aim; renderer.shadowMap.needsUpdate = true; }
    reflector.updateWorldMatrix(true, false); feedW.copy(feed); reflector.localToWorld(feedW);

    const dA = hero ? hTM * hA : band(p, ACQ[0] - .02, .5), uA = hero ? hTC * hA : band(p, .9, 1.2) + band(p, .3, .44) * .8;
    dBeam.visible = dA > .003; uBeam.visible = uA > .003;
    dBeam.material.opacity = dA * (hero ? .08 : add ? .1 : .22); uBeam.material.opacity = uA * (hero ? .1 : add ? .1 : .22);
    // A hero downlink in progress fades back as the story's downlink grows, so the link never blinks off.
    const reach = hero ? 1 : clamp((p - ACQ[0]) / (ACQ[1] - ACQ[0]));
    tip.lerpVectors(target, feedW, reach);
    if (reach >= 1 !== acquired) { acquired = reach >= 1; opts.onAcquire?.(acquired); }
    dBeam.visible = dBeam.visible && reach > 0;
    if (dBeam.visible) beamTo(dBeam, tip, target);
    if (uBeam.visible) beamTo(uBeam, tmp3.copy(feedW).add(UP_OFF), target);
    // Packets keep a steady on-screen size; smaller in the hero, where the link runs far into the sky.
    const sz = k => camera.position.distanceTo(k.position) * (hero ? .006 : .008);
    showAll(down, dBeam.visible); showAll(up, uBeam.visible);
    if (dBeam.visible) down.forEach((k, i) => { const f = wrap(t * .3 + i / down.length); k.position.lerpVectors(target, tip, f); k.material.opacity = dA * (1 - Math.abs(f - .5) * 1.1); k.scale.setScalar(sz(k)); });
    if (uBeam.visible) up.forEach((k, i) => { const f = wrap(t * .3 + i / up.length); k.position.lerpVectors(feedW, target, f); k.material.opacity = uA * (1 - Math.abs(f - .5) * 1.1); k.scale.setScalar(sz(k)); });
    const bh = band(p, .42, .68);
    fibreMat.opacity = .25 + bh * .7;
    showAll(back, bh > .003);
    if (bh > .003) back.forEach((k, i) => { const f = Math.min(.9999, wrap(t * .2 + i / back.length)); fibre.getPointAt(f, k.position); k.position.y += .6; k.material.opacity = bh; k.scale.setScalar(2.5); });

    const ss = band(p, .66, 1.1, .06);
    ssa.visible = ss > .001;
    if (ssa.visible) {
      ssa.position.copy(sat.position); ssa.position.y -= avoid * 12;
      debris.forEach((d, i) => { dP.copy(d.b); dP.x = ((d.b.x + t * d.sp + 300) % 600) - 300; d.e.x += d.rx * dt; d.e.y += d.ry * dt; dQ.setFromEuler(d.e); dS.setScalar(d.size * ss); debrisMesh.setMatrixAt(i, dM.compose(dP, dQ, dS)); });
      debrisMesh.instanceMatrix.needsUpdate = true;
      const ap = clamp((p - .68) / .18); threat.position.copy(thrDir).multiplyScalar(180 * (1 - ap) - 14 * ap); threat.rotation.x += dt; threat.rotation.y += dt * .6;
      const risk = 1 - clamp((p - .86) / .04);
      const camRel = tmp2.copy(inRoom ? rtCam.position : camera.position).sub(ssa.position);
      ring.lookAt(camRel); ring.scale.setScalar(1 + Math.sin(t * 4) * .05); ring.material.color.setHex(risk > .5 ? RISK : OK); ring.material.opacity = ss;
      ring2.position.copy(threat.position); ring2.lookAt(camRel); ring2.material.opacity = ss * risk;
      satPath.material.opacity = ss * risk; thrPath.material.opacity = ss * .9 * risk; newPath.position.y = avoid * 12; newPath.material.opacity = ss * avoid;
    }

    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[i], b = KEYS[i + 1], k = ease(clamp((p - a.p) / (b.p - a.p)));
    pos.lerpVectors(a.pos(), b.pos(), k); tgt.lerpVectors(a.tgt(), b.tgt(), k);
    pos.x += px * 3; pos.y -= py * 1.5; if (pos.y < 2) pos.y = 2;
    camera.position.copy(pos); camera.lookAt(tgt);
    if (W > 900 && useOffset) camera.setViewOffset(W, H, -W * .17, 0, W, H); else camera.clearViewOffset();
    camera.updateMatrixWorld();

    place(L.sat, SAT_TAG.copy(sat.position).add(TAG_UP), (p > -.22 && p < .66) || p > .95 ? 1 : 0, -50, -30);
    if (hero && trk >= 0) {
      const txt = fleet[trk].name + ' · ' + LINK_TEXT[link];
      if (L.track.textContent !== txt) { L.track.textContent = txt; L.track.style.borderColor = LINK_COL[link]; L.track._w = 0; }
    }
    place(L.track, target, hero && trk >= 0 && fleet[trk].on ? 1 : 0, 18, -14);
    place(L.tm, tmp.lerpVectors(feedW, target, .45), dA > .5 && acquired && !hero ? 1 : 0, 10, 0);
    place(L.tc, tmp.lerpVectors(feedW, sat.position, .62), uA > .5 && !hero ? 1 : 0, -120, 0);
    place(L.gs, AT_GS, band(p, .15, .5) > .5 ? 1 : 0);
    place(L.mcs, AT_MCS, band(p, .45, .555) > .5 ? 1 : 0);
    place(L.wallM, AT_WALL_M, band(p, .58, .72) > .5 ? 1 : 0, 0, 0);
    place(L.wallS, AT_WALL_S, band(p, .76, .9) > .5 ? 1 : 0, 0, -34);

    renderer.info.reset();
    // Wall canvases re-upload as textures, so redraw them only while the control centre is in view.
    if (t - lastDraw > (low ? .5 : .33) && p > .5 && p < .95) { lastDraw = t; drawScreens(t, p); }
    // The live orbit view on the Chakra wall is a second scene render: only while that wall is in view, at half rate (quarter on low).
    if (inRoom && p > .66 && rtTick++ % (low ? 4 : 2) === 0) { renderer.setRenderTarget(rt); renderer.render(scene, rtCam); renderer.setRenderTarget(null); }
    renderer.render(scene, camera);
    cpuAvg += (performance.now() - t0 - cpuAvg) * .2;
  }
  raf = requestAnimationFrame(frame);
  const api = {
    setProgress(v) { progress = clamp(v, -.3, 1); },
    setTheme(n) { applyTheme(n); renderer.shadowMap.needsUpdate = true; lastRender = 0; },
    setOffset(v) { useOffset = !!v; },
    setPaused(v) { paused = !!v; },
    stats() { const i = renderer.info.render; return { cpuMs: +cpuAvg.toFixed(2), calls: i.calls, triangles: i.triangles, dpr: renderer.getPixelRatio(), shadows: renderer.shadowMap.enabled }; },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', onMove);
      rt.dispose(); envRT && envRT.dispose(); pmrem.dispose(); renderer.dispose(); renderer.forceContextLoss(); el.innerHTML = '';
    }
  };
  return api;
}
