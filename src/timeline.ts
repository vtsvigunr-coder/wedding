import { clamp01, fitScale, headerHeight, onScrollFrame, prefersReducedMotion } from './scroll';

/** How long a stop takes to fade in once the lock has reached it. */
export const STOP_FADE = 0.05;

/** The design's canvas; the frame is scaled down to fit shorter viewports. */
export const FRAME_HEIGHT = 782;

/**
 * The lock's descent, as the height of its centre on the design's canvas. It
 * starts where the design parks it, at the head of the line, and finishes with
 * its lower edge on the car's roof — the line's dots all fall in between.
 */
export const LOCK_START = 131.5;
export const LOCK_END = 655.5;

/**
 * How far the pinned stage has been scrolled through, 0 to 1. The stage is
 * taller than the viewport and the pin sticks for exactly the surplus, so the
 * lock makes its whole descent with the programme held still in front of the
 * visitor rather than while it is still sliding into view.
 */
export function timelineProgress(top: number, height: number, viewportHeight: number): number {
  const travel = height - viewportHeight;
  if (travel <= 0) return top <= 0 ? 1 : 0;
  return clamp01(-top / travel);
}

/**
 * How much the frame has to shrink to fit a viewport shorter than the design,
 * with `reserved` — the header — kept clear at the top. The frame is anchored
 * to the bottom of the pin, so shrinking it by exactly the header's height is
 * what lands its top edge just below the header rather than behind it.
 */
export function frameScale(viewportHeight: number, reserved = 0): number {
  return fitScale(viewportHeight, FRAME_HEIGHT, reserved);
}

/** How far the lock has travelled from its resting place, in canvas pixels. */
export function lockOffset(progress: number): number {
  return clamp01(progress) * (LOCK_END - LOCK_START);
}

/**
 * The progress at which the lock's centre draws level with `y`. Stops use it so
 * they announce themselves as the lock arrives rather than on a fixed timer.
 */
export function reachedAt(y: number): number {
  const descent = LOCK_END - LOCK_START;
  if (descent <= 0) return y <= LOCK_START ? 0 : 1;
  return clamp01((y - LOCK_START) / descent);
}

/** A stop fades in over a short window once the lock has reached it. */
export function stopReveal(progress: number, threshold: number): number {
  return clamp01((clamp01(progress) - threshold) / STOP_FADE);
}

export function initTimeline(): void {
  const section = document.getElementById('timeline');
  const frame = document.getElementById('timeline-frame');
  const lock = document.getElementById('timeline-lock');
  const stopsList = document.getElementById('timeline-stops');
  if (!section || !frame || !lock || !stopsList) return;

  const stops = Array.from(stopsList.querySelectorAll<HTMLElement>('.timeline__stop'));
  // Each stop carries the height of its own dot on the line, in the design's
  // canvas coordinates. The frame's fit-to-viewport scale covers the lock too,
  // so both sides of the comparison stay in canvas pixels.
  const thresholds = stops.map((stop) => reachedAt(Number(stop.dataset.reach ?? 0)));

  const apply = (progress: number) => {
    lock.style.transform = `translateY(${lockOffset(progress)}px)`;
    stops.forEach((stop, index) => {
      stop.style.setProperty('--reveal', String(stopReveal(progress, thresholds[index] ?? 1)));
    });
  };

  const fit = () => {
    frame.style.setProperty('--fit', String(frameScale(window.innerHeight, headerHeight())));
  };

  fit();

  if (prefersReducedMotion()) {
    // Nothing is scrubbed: the lock is parked on the car and every stop shown,
    // so the programme reads as already played out.
    apply(1);
    return;
  }

  window.addEventListener('resize', fit, { passive: true });

  onScrollFrame(() => {
    const rect = section.getBoundingClientRect();
    apply(timelineProgress(rect.top, rect.height, window.innerHeight));
  });
}
