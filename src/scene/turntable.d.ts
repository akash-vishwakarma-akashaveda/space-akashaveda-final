export interface Turntable {
  dispose(): void;
}

/** One of the site's models (the GS-01 dish or the satellite), turning slowly in the night-scene lighting. */
export function mountTurntable(el: HTMLElement, opts: { url: string; kind: 'dish' | 'sat' }): Turntable;
