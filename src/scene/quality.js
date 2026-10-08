// Device quality tier for the WebGL scenes: phones/tablets and very low-end machines start on "low";
// everything else starts on "high" and the scene governor steps down at runtime if frames run long.
// Override with ?quality=low|high.
export function detectQuality() {
  const forced = new URLSearchParams(location.search).get('quality');
  if (forced === 'low' || forced === 'high') return forced;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  const saveData = navigator.connection && navigator.connection.saveData;
  return coarse || cores < 4 || mem < 4 || saveData ? 'low' : 'high';
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
