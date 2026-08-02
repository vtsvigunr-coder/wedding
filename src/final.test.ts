import { describe, expect, it } from 'vitest';
import { BUD_SCALE, bloomFrame, bloomProgress, ease, ramp } from './final';

describe('bloomProgress', () => {
  it('has not started while the section is still below the fold', () => {
    expect(bloomProgress(900, 720, 800)).toBe(0);
    expect(bloomProgress(800, 720, 800)).toBe(0);
  });

  it('is finished once the section sits centred', () => {
    // Centred means the top edge is (viewport - height) / 2 from the top.
    expect(bloomProgress((800 - 720) / 2, 720, 800)).toBeCloseTo(1);
    expect(bloomProgress(-400, 720, 800)).toBe(1);
  });

  it('runs across the rise in between', () => {
    const half = 800 - (800 + 720) / 2 / 2;
    expect(bloomProgress(half, 720, 800)).toBeCloseTo(0.5);
  });

  it('is settled either way for a section with no rise to scrub', () => {
    expect(bloomProgress(10, 0, 0)).toBe(0);
    expect(bloomProgress(-10, 0, 0)).toBe(1);
  });
});

describe('ramp', () => {
  it('is zero before the window and one after it', () => {
    expect(ramp(0.1, 0.2, 0.6)).toBe(0);
    expect(ramp(0.7, 0.2, 0.6)).toBe(1);
  });

  it('runs straight across the window', () => {
    expect(ramp(0.4, 0.2, 0.6)).toBeCloseTo(0.5);
  });

  it('snaps for a window with no width', () => {
    expect(ramp(0.5, 0.5, 0.5)).toBe(1);
    expect(ramp(0.4, 0.5, 0.5)).toBe(0);
  });
});

describe('ease', () => {
  it('is pinned at both ends', () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(-2)).toBe(0);
    expect(ease(3)).toBe(1);
  });

  it('passes through the middle unchanged but flattens the ends', () => {
    expect(ease(0.5)).toBeCloseTo(0.5);
    expect(ease(0.1)).toBeLessThan(0.1);
    expect(ease(0.9)).toBeGreaterThan(0.9);
  });
});

describe('bloomFrame', () => {
  it('opens on the buds alone, at their painted size', () => {
    const frame = bloomFrame(0);
    expect(frame.scale).toBeCloseTo(BUD_SCALE);
    expect(frame.buds).toBe(1);
    expect(frame.flowers).toBe(0);
    expect(frame.text).toBe(0);
  });

  it('closes on the flowers alone, grown to full size, with the words shown', () => {
    const frame = bloomFrame(1);
    expect(frame.scale).toBeCloseTo(1);
    expect(frame.buds).toBe(0);
    expect(frame.flowers).toBe(1);
    expect(frame.text).toBe(1);
  });

  it('keeps both paintings on screen through the middle, so the sheet is never bare', () => {
    for (const p of [0.3, 0.4, 0.5, 0.6]) {
      const frame = bloomFrame(p);
      expect(frame.buds + frame.flowers).toBeGreaterThan(0.4);
    }
  });

  it('holds the words back until the flowers are mostly out', () => {
    expect(bloomFrame(0.5).text).toBe(0);
    expect(bloomFrame(0.55).text).toBe(0);
    expect(bloomFrame(0.8).flowers).toBeGreaterThan(0.8);
  });

  it('grows the two paintings together, so the cross-fade reads as one sheet', () => {
    // A single scale is handed to both; the test guards the shape of the frame
    // rather than a second, drifting value.
    expect(Object.keys(bloomFrame(0.5))).toEqual(['scale', 'buds', 'flowers', 'text']);
  });
});
