import * as T from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { axleDish, createLoader, prepareSatellite } from './loaders.js';
import { detectQuality, reducedMotion } from './quality.js';

// Product-page visual: one of the site's models, lit like the night scene, turning slowly. Renders at 30 fps,
// only while on screen; with reduced motion it renders once and stays still.
const FRAME_MS = 1000 / 30, PED_H = 9.2;

export function mountTurntable(el, { url, kind }) {
  const low = detectQuality() === 'low', calm = reducedMotion();
  const renderer = new T.WebGLRenderer({ antialias: !low, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(low ? 1 : 1.5, devicePixelRatio || 1));
  renderer.setSize(el.clientWidth, el.clientHeight);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  el.appendChild(renderer.domElement);

  const scene = new T.Scene(), camera = new T.PerspectiveCamera(30, el.clientWidth / el.clientHeight, .1, 3000);
  const pmrem = new T.PMREMGenerator(renderer), env = pmrem.fromScene(new RoomEnvironment(), .04);
  scene.environment = env.texture;
  scene.add(new T.HemisphereLight(0xb8c4d6, 0x0b1628, .9));
  const key = new T.DirectionalLight(0xfff4e0, 2.4); key.position.set(40, 60, 50); scene.add(key);
  const rim = new T.DirectionalLight(0x7fa3d6, 1.4); rim.position.set(-60, 20, -50); scene.add(rim);

  const spin = new T.Group(); scene.add(spin);
  let ready = false;
  createLoader().load(url, (g) => {
    if (kind === 'dish') {
      // The station as it stands: pedestal, yoke, and the dish raised to 45° elevation.
      const metal = new T.MeshStandardMaterial({ color: 0xdcdfe3, roughness: .55, metalness: .1, side: T.DoubleSide });
      const concrete = new T.MeshStandardMaterial({ color: 0xa8a9ab, roughness: .85 });
      const { geometry, axleY } = axleDish(g.scene, 30, PED_H);
      const tilt = new T.Group(); tilt.position.y = axleY; tilt.rotation.x = Math.PI / 4; tilt.add(new T.Mesh(geometry, metal)); spin.add(tilt);
      const ped = new T.Mesh(new T.CylinderGeometry(6.5, 7.2, PED_H, 48), concrete); ped.position.y = PED_H / 2; spin.add(ped);
      [-5.2, 5.2].forEach((x) => { const arm = new T.Mesh(new T.BoxGeometry(1.1, axleY - PED_H + 1.2, 3.4), concrete); arm.position.set(x, (axleY + PED_H) / 2 + .3, 0); spin.add(arm); });
    } else {
      const m = g.scene; prepareSatellite(m); spin.add(m);
    }
    // Centre the model and frame it.
    const box = new T.Box3().setFromObject(spin), c = box.getCenter(new T.Vector3()), r = box.getBoundingSphere(new T.Sphere()).radius;
    spin.children.forEach((o) => o.position.sub(c));
    const d = r / Math.sin(T.MathUtils.degToRad(camera.fov / 2)) * 1.05;
    camera.position.set(d * .78, d * (kind === 'dish' ? .28 : .36), d * .62); camera.lookAt(0, 0, 0);
    ready = true; last = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('ready')));
  }, undefined, (e) => console.warn('turntable', e));

  let raf, last = 0, visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(el);
  const ro = new ResizeObserver(() => { renderer.setSize(el.clientWidth, el.clientHeight); camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); last = 0; }); ro.observe(el);
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (!ready || !visible || (last && (calm || now - last < FRAME_MS - 2))) return;
    spin.rotation.y += last ? Math.min(.1, (now - last) / 1000) * .22 : 0;
    last = now;
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);
  return {
    dispose() { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); env.dispose(); pmrem.dispose(); renderer.dispose(); renderer.forceContextLoss(); el.innerHTML = ''; },
  };
}
