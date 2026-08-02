import { clamp01, onScrollFrame, prefersReducedMotion } from './scroll';

/**
 * The closing section. Two paintings of the same sheet of paper are stacked:
 * one where the branches carry buds, one where they have opened into full
 * flowers. Scrolling cross-fades between them while both grow from the buds'
 * smaller box to the blooms' larger one, so the corners read as opening rather
 * than swapping. The words appear last, once the flowers are mostly out.
 */

/** The buds are painted at this fraction of the bloomed sheet's size. */
export const BUD_SCALE = 317 / 366;

/**
 * How far the section has risen, 0 to 1. It starts the moment the section's top
 * edge crosses the bottom of the screen and finishes when the section sits
 * centred, which is where the visitor stops to read it.
 */
export function bloomProgress(top: number, height: number, viewportHeight: number): number {
  const travel = (viewportHeight + height) / 2;
  if (travel <= 0) return top <= 0 ? 1 : 0;
  return clamp01((viewportHeight - top) / travel);
}

/**
 * `value` remapped onto 0..1 across the window `from`..`to`, so each part of
 * the bloom can run over its own stretch of the section's rise.
 */
export function ramp(value: number, from: number, to: number): number {
  if (to <= from) return value >= to ? 1 : 0;
  return clamp01((value - from) / (to - from));
}

/** Eases the ends of a ramp so nothing starts or stops with a visible jolt. */
export function ease(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

export interface BloomFrame {
  /** Shared by both paintings, which is what makes the cross-fade a growth. */
  scale: number;
  buds: number;
  flowers: number;
  text: number;
}

export function bloomFrame(progress: number): BloomFrame {
  const p = clamp01(progress);
  return {
    scale: BUD_SCALE + (1 - BUD_SCALE) * ease(ramp(p, 0, 0.9)),
    // The buds thin out well before the flowers are fully in, so the two
    // paintings overlap through the middle instead of dissolving into paper.
    buds: 1 - ease(ramp(p, 0.1, 0.7)),
    flowers: ease(ramp(p, 0.15, 0.85)),
    text: ease(ramp(p, 0.55, 0.95)),
  };
}

export function initFinal(): void {
  const section = document.getElementById('final');
  if (!section) return;

  const apply = (progress: number) => {
    const frame = bloomFrame(progress);
    section.style.setProperty('--bloom-scale', String(frame.scale));
    section.style.setProperty('--buds', String(frame.buds));
    section.style.setProperty('--flowers', String(frame.flowers));
    section.style.setProperty('--text', String(frame.text));
  };

  if (prefersReducedMotion()) {
    // Nothing is scrubbed: the flowers are shown already open, with the words
    // on them, which is the state the section is really about.
    apply(1);
    return;
  }

  onScrollFrame(() => {
    const rect = section.getBoundingClientRect();
    apply(bloomProgress(rect.top, rect.height, window.innerHeight));
  });
}
