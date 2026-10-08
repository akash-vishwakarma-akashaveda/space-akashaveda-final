export type Theme = 'dark' | 'light';

export interface GSSceneOptions {
  theme?: Theme;
  dishUrl: string;
  satUrl: string;
  /** Shift the camera view right on wide screens so the left column stays clear. Default true. */
  offset?: boolean;
  /** Defaults to a device-based guess (see quality.js). */
  quality?: 'low' | 'high';
  /** Called when the downlink reaches GS-01 (true) or pulls back (false) as the journey scrolls. */
  onAcquire?: (acquired: boolean) => void;
  /** Called once both models are loaded and the scene has drawn them. */
  onReady?: () => void;
}

export interface GSScene {
  /** Journey progress, clamped to [-0.3, 1]. Negative values cover the problem/solution chapters. */
  setProgress(p: number): void;
  setTheme(theme: Theme): void;
  setOffset(on: boolean): void;
  /** Stop rendering, e.g. while a dashboard pop-up covers the stage. */
  setPaused(paused: boolean): void;
  /** Last frame's renderer stats (for profiling). */
  stats(): { cpuMs: number; calls: number; triangles: number; dpr: number; shadows: boolean };
  dispose(): void;
}

export function mountScene(el: HTMLElement, opts: GSSceneOptions): GSScene;
