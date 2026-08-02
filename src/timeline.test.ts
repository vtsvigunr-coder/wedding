import { describe, expect, it } from 'vitest';
import {
  frameScale,
  pointAt,
  reachedAt,
  sampleRoute,
  stopReveal,
  timelineProgress,
  type Point,
  type RouteSegment,
} from './timeline';

/**
 * A straight segment running from y `from` to y `to`. `pointAt` is handed a
 * distance measured from the segment's own drawn start, which is what a real
 * `getPointAtLength` takes — reversing is the caller's job.
 */
function vertical(from: number, to: number, reversed = false): RouteSegment {
  const step = to > from ? 1 : -1;
  return {
    length: Math.abs(to - from),
    reversed,
    pointAt: (distance: number) => ({ x: 0, y: from + step * distance }),
  };
}

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
});

describe('sampleRoute', () => {
  it('walks the segments end to end', () => {
    const samples = sampleRoute([vertical(0, 100), vertical(100, 300)], 3);
    expect(samples.map((p) => p.y)).toEqual([0, 100, 200, 300]);
  });

  it('takes a reversed segment back to front', () => {
    const samples = sampleRoute([vertical(0, 100, true)], 2);
    expect(samples.map((p) => p.y)).toEqual([100, 50, 0]);
  });

  it('returns nothing for a route with no length', () => {
    expect(sampleRoute([vertical(0, 0)], 4)).toEqual([]);
  });
});

describe('pointAt', () => {
  const samples: Point[] = [
    { x: 0, y: 0 },
    { x: 5, y: 10 },
    { x: 10, y: 20 },
  ];

  it('sits at the start of the route at zero', () => {
    expect(pointAt(samples, 0)).toEqual({ x: 0, y: 0 });
  });

  it('sits at the end of the route at one', () => {
    expect(pointAt(samples, 1)).toEqual({ x: 10, y: 20 });
  });

  it('clamps progress that runs past either end', () => {
    expect(pointAt(samples, -3)).toEqual({ x: 0, y: 0 });
    expect(pointAt(samples, 4)).toEqual({ x: 10, y: 20 });
  });

  it('has no point to offer for an unsampled route', () => {
    expect(pointAt([], 0.5)).toBeNull();
  });
});

describe('reachedAt', () => {
  const samples = sampleRoute([vertical(0, 100)], 10);

  it('is zero for a height the route starts at', () => {
    expect(reachedAt(samples, 0)).toBe(0);
  });

  it('is the fraction at which the route first descends past the height', () => {
    expect(reachedAt(samples, 50)).toBeCloseTo(0.5);
  });

  it('resolves a height the route never reaches to the very end', () => {
    expect(reachedAt(samples, 400)).toBe(1);
  });

  it('answers on the first crossing, ignoring later ones', () => {
    const wandering = sampleRoute([vertical(0, 100), vertical(100, 20, true), vertical(20, 200)], 30);
    // The route dips back up after its first pass through 50, which must not
    // push the answer to the later crossing.
    expect(reachedAt(wandering, 50)).toBeLessThan(0.3);
  });
});

describe('stopReveal', () => {
  it('keeps a stop hidden until the heart draws level with it', () => {
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
