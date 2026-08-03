import { describe, expect, it } from 'vitest';
import {
  FRAME_HEIGHT,
  LOCK_END,
  LOCK_START,
  STOP_FADE,
  frameScale,
  lockOffset,
  reachedAt,
  stopReveal,
  timelineProgress,
} from './timeline';

describe('timelineProgress', () => {
  it('is zero while the stage has yet to pin', () => {
    expect(timelineProgress(400, 2400, 800)).toBe(0);
    expect(timelineProgress(0, 2400, 800)).toBe(0);
  });

  it('is halfway through the pin at half the surplus', () => {
    expect(timelineProgress(-800, 2400, 800)).toBeCloseTo(0.5);
  });

  it('is one once the stage has been scrolled through', () => {
    expect(timelineProgress(-1600, 2400, 800)).toBe(1);
    expect(timelineProgress(-4000, 2400, 800)).toBe(1);
  });

  it('is settled either way for a stage with no surplus to scrub', () => {
    expect(timelineProgress(10, 800, 800)).toBe(0);
    expect(timelineProgress(-10, 800, 800)).toBe(1);
  });
});

describe('frameScale', () => {
  it('leaves the design canvas alone on a viewport tall enough for it', () => {
    expect(frameScale(900)).toBe(1);
    expect(frameScale(782)).toBe(1);
  });

  it('shrinks the canvas to fit a shorter viewport', () => {
    expect(frameScale(391)).toBeCloseTo(0.5);
  });

  it('falls back to full size before the viewport has been measured', () => {
    expect(frameScale(0)).toBe(1);
  });

  it('shrinks by the header it is asked to keep clear', () => {
    // Bottom-anchored, so a frame this much shorter starts exactly below it.
    expect(frameScale(FRAME_HEIGHT + 72, 72)).toBeCloseTo(1);
    expect(frameScale(FRAME_HEIGHT / 2 + 72, 72)).toBeCloseTo(0.5);
    // The same viewport without the reserve would not have shrunk at all.
    expect(frameScale(FRAME_HEIGHT + 72)).toBe(1);
  });
});

describe('lockOffset', () => {
  it('leaves the lock parked before the descent begins', () => {
    expect(lockOffset(0)).toBe(0);
  });

  it('walks the lock the whole way down by the end', () => {
    expect(lockOffset(1)).toBeCloseTo(LOCK_END - LOCK_START);
  });

  it('runs evenly in between, so the line reads as one steady descent', () => {
    expect(lockOffset(0.5)).toBeCloseTo((LOCK_END - LOCK_START) / 2);
  });

  it('clamps progress that runs past either end', () => {
    expect(lockOffset(-3)).toBe(0);
    expect(lockOffset(4)).toBeCloseTo(LOCK_END - LOCK_START);
  });
});

describe('reachedAt', () => {
  it('is zero for the height the lock starts at', () => {
    expect(reachedAt(LOCK_START)).toBe(0);
  });

  it('is one for the height it finishes at', () => {
    expect(reachedAt(LOCK_END)).toBe(1);
  });

  it('is the fraction of the descent at which the lock draws level', () => {
    expect(reachedAt((LOCK_START + LOCK_END) / 2)).toBeCloseTo(0.5);
  });

  it('clamps heights above and below the descent', () => {
    expect(reachedAt(LOCK_START - 200)).toBe(0);
    expect(reachedAt(LOCK_END + 200)).toBe(1);
  });

  it('leaves every dot on the line room to finish fading in', () => {
    // The last stop is the tight one: its dot sits near the foot of the
    // descent, and the fade window still has to close before the scrub ends.
    expect(reachedAt(619) + STOP_FADE).toBeLessThan(1);
  });
});

describe('stopReveal', () => {
  it('keeps a stop hidden until the lock draws level with it', () => {
    expect(stopReveal(0.2, 0.4)).toBe(0);
    expect(stopReveal(0.4, 0.4)).toBe(0);
  });

  it('is fully shown once the fade window has passed', () => {
    expect(stopReveal(0.45, 0.4)).toBeCloseTo(1);
    expect(stopReveal(1, 0.4)).toBe(1);
  });

  it('fades in across the window', () => {
    expect(stopReveal(0.425, 0.4)).toBeCloseTo(0.5);
  });
});
