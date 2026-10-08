export interface SpaceBg {
  dispose(): void;
}

/** 2D canvas starfield behind the lower page, drifting with scroll. */
export function mountSpace(el: HTMLElement): SpaceBg;
