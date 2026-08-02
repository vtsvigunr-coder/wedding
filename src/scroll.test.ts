import { describe, expect, it } from 'vitest';
import { clamp01 } from './scroll';

describe('clamp01', () => {
  it('passes values inside the range straight through', () => {
    expect(clamp01(0.25)).toBe(0.25);
  });

  it('clamps at both ends', () => {
    expect(clamp01(-3)).toBe(0);
    expect(clamp01(7)).toBe(1);
  });

  it('keeps the boundaries exact', () => {
    expect(clamp01(0)).toBe(0);
    expect(clamp01(1)).toBe(1);
  });

  it('normalises negative zero, which negating a zero offset produces', () => {
    expect(Object.is(clamp01(-0), 0)).toBe(true);
  });

  it('returns zero for NaN rather than passing it into a style value', () => {
    expect(clamp01(Number.NaN)).toBe(0);
  });
});
