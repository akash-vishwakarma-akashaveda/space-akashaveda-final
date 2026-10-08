// Builds web-ready models from the NASA sources in project/models → src/assets/models.
// Both scenes replace the dish material and never texture the satellite, so UVs and textures are dropped.
// The satellite ships per-face normals (no shared vertices), which blocks welding and simplification, so its
// normals are dropped too and rebuilt at load: flat shading for "-fl" materials, smooth for the rest.
// Run: npm run models
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, quantize, simplify, weld } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

const MODELS = [
  // ratio: target share of triangles kept; error: max deviation as a fraction of the mesh radius.
  { src: 'project/models/dish-70m.glb', out: 'src/assets/models/dish-70m.glb', ratio: 0.6, error: 0.0015, dropNormals: false },
  { src: 'project/models/landsat8.glb', out: 'src/assets/models/landsat8.glb', ratio: 0.25, error: 0.004, dropNormals: true },
];

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule(), 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

for (const m of MODELS) {
  const doc = await io.read(m.src);
  const root = doc.getRoot();
  for (const mesh of root.listMeshes())
    for (const prim of mesh.listPrimitives()) {
      prim.setAttribute('TEXCOORD_0', null);
      if (m.dropNormals) prim.setAttribute('NORMAL', null);
    }
  for (const mat of root.listMaterials()) mat.setBaseColorTexture(null);
  root.listTextures().forEach((t) => t.dispose());
  for (const ext of root.listExtensionsUsed()) if (ext.extensionName === 'EXT_texture_webp' || ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  const tris = () => root.listMeshes().flatMap((x) => x.listPrimitives()).reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0);
  const before = tris();
  await doc.transform(
    prune(),
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: m.ratio, error: m.error }),
    quantize(),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  );
  await io.write(m.out, doc);
  const { size } = await import('node:fs').then((fs) => fs.statSync(m.out));
  console.log(`${m.out}: ${before | 0} → ${tris() | 0} triangles, ${(size / 1024) | 0} kB`);
}
