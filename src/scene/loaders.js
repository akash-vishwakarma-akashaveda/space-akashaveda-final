import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// Models are meshopt-compressed by scripts/optimize-models.mjs. Cache the fetched bytes so the
// journey scene and the product-page turntables share one download.
T.Cache.enabled = true;

export function createLoader() {
  return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
}

// Height of the elevation axle in the dish model, as a fraction of its full height (the model points at zenith).
const DISH_AXLE = 0.225;

/**
 * The dish ships as one mesh: reflector, quadripod, elevation wheel and counterweight, all of which turn
 * together about the elevation axle (the model's x axis). Bake it to `height`, standing on `lift`, with the
 * axle at the origin so the mesh tilts by rotating about x. Returns the geometry and the axle height.
 */
export function axleDish(root, height, lift) {
  root.updateMatrixWorld(true);
  let mesh;
  root.traverse((o) => { if (o.isMesh && !mesh) mesh = o; });
  const geo = mesh.geometry.clone();
  // Quantized positions can't hold the baked transform, so convert to floats first.
  for (const k of ['position', 'normal']) {
    const a = geo.attributes[k];
    if (!a) continue;
    const f = new Float32Array(a.count * 3);
    for (let i = 0; i < a.count; i++) f.set([a.getX(i), a.getY(i), a.getZ(i)], i * 3);
    geo.setAttribute(k, new T.BufferAttribute(f, 3));
  }
  geo.applyMatrix4(mesh.matrixWorld).computeBoundingBox();
  const b = geo.boundingBox, k = height / (b.max.y - b.min.y), axleY = lift + DISH_AXLE * height;
  geo.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2).scale(k, k, k).translate(0, lift - axleY, 0);
  geo.computeBoundingBox();
  return { geometry: geo, axleY };
}

/**
 * The optimized satellite ships without normals: rebuild them (flat for "-fl" materials, smooth otherwise).
 * Also gives its foil, solar panels and frame their metal finish.
 */
export function prepareSatellite(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt) => {
      const n = (mt.name || '').toLowerCase();
      if (n.endsWith('-fl')) mt.flatShading = true;
      mt.fog = false;
      if (n.includes('gold') || n.includes('bronze')) { mt.metalness = .95; mt.roughness = .28; mt.color?.setHex(n.includes('dark') ? 0x9c6b22 : 0xd4a444); }
      else if (n.includes('solarpanel-face')) { mt.metalness = .6; mt.roughness = .22; mt.color?.setHex(0x1b2450); }
      else if (n.includes('silver') || n.includes('grey') || n.includes('mainpanels')) { mt.metalness = .85; mt.roughness = .3; }
    });
  });
}
