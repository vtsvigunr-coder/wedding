import { describe, expect, it } from 'vitest';
import { bouquetOffset, bouquetProgress, dateOpacity } from './bouquet';

describe('bouquetProgress', () => {
  it('is zero while the section is still below the fold', () => {
    expect(bouquetProgress(900, 467, 800)).toBe(0);
  });

  it('is zero exactly as the section touches the bottom of the viewport', () => {
    expect(bouquetProgress(800, 467, 800)).toBe(0);
  });

  it('is one once the whole section is in view', () => {
    expect(bouquetProgress(800 - 467, 467, 800)).toBe(1);
  });

  it('is halfway when half the section has risen', () => {
    expect(bouquetProgress(800 - 233.5, 467, 800)).toBeCloseTo(0.5);
  });

  it('stays clamped after the section scrolls past the top', () => {
    expect(bouquetProgress(-1000, 467, 800)).toBe(1);
  });

  it('returns zero for a section with no height rather than dividing by zero', () => {
    expect(bouquetProgress(0, 0, 800)).toBe(0);
  });
});

describe('bouquetOffset', () => {
  it('starts at the step 1 position', () => {
    expect(bouquetOffset(0)).toBe(-142);
  });

  it('ends at the step 2 position', () => {
    expect(bouquetOffset(1)).toBe(-338);
  });

  it('interpolates between the two keyframes', () => {
    expect(bouquetOffset(0.5)).toBe(-240);
  });

  it('clamps out-of-range progress to the keyframes', () => {
    expect(bouquetOffset(-1)).toBe(-142);
    expect(bouquetOffset(2)).toBe(-338);
  });
});

describe('dateOpacity', () => {
  it('keeps the date hidden while the flowers still cover it', () => {
    expect(dateOpacity(0)).toBe(0);
    expect(dateOpacity(0.55)).toBe(0);
  });

  it('is fully opaque before the rise finishes', () => {
    expect(dateOpacity(0.85)).toBe(1);
    expect(dateOpacity(1)).toBe(1);
  });

  it('fades in across the window between those points', () => {
    expect(dateOpacity(0.7)).toBeCloseTo(0.5);
  });
});
