import { clamp01, onScrollFrame, prefersReducedMotion } from './scroll';

// The two keyframes the design calls "step 1" and "step 2": the bouquet's clip
// container starts at -142px and settles at -338px, uncovering the date block.
const BOUQUET_TOP_START = -142;
const BOUQUET_TOP_END = -338;
const DATE_FADE_FROM = 0.55;
const DATE_FADE_TO = 0.85;

/**
 * How far the section has risen through the viewport, 0 to 1. Zero has its top
 * edge level with the bottom of the viewport, one has it fully in view.
 */
export function bouquetProgress(top: number, height: number, viewportHeight: number): number {
  if (height <= 0) return 0;
  return clamp01((viewportHeight - top) / height);
}

/** Vertical position of the bouquet's clip container for a given progress. */
export function bouquetOffset(progress: number): number {
  const q = clamp01(progress);
  return BOUQUET_TOP_START + (BOUQUET_TOP_END - BOUQUET_TOP_START) * q;
}

/** The date block fades in over the back half of the rise, once flowers clear it. */
export function dateOpacity(progress: number): number {
  return clamp01((clamp01(progress) - DATE_FADE_FROM) / (DATE_FADE_TO - DATE_FADE_FROM));
}

export function initBouquet(): void {
  const section = document.getElementById('bouquet');
  const flowers = document.getElementById('bouquet-flowers');
  const date = document.getElementById('bouquet-date');
  if (!section || !flowers || !date) return;

  const apply = (progress: number) => {
    flowers.style.top = `${bouquetOffset(progress)}px`;
    date.style.opacity = String(dateOpacity(progress));
  };

  if (prefersReducedMotion()) {
    apply(1);
    return;
  }

  onScrollFrame(() => {
    const rect = section.getBoundingClientRect();
    apply(bouquetProgress(rect.top, rect.height, window.innerHeight));
  });
}
