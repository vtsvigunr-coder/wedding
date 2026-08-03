import { describe, expect, it } from 'vitest';
import { clamp01, fitScale, headerHeight } from './scroll';

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

describe('fitScale', () => {
  it('leaves a design alone on a viewport with room to spare', () => {
    expect(fitScale(900, 720)).toBe(1);
    expect(fitScale(720, 720)).toBe(1);
  });

  it('shrinks a design taller than the viewport', () => {
    expect(fitScale(360, 720)).toBeCloseTo(0.5);
  });

  it('measures against the room left once the header is reserved', () => {
    // 800 tall with 80 held back is 720 of usable room, which the design fills.
    expect(fitScale(800, 720, 80)).toBeCloseTo(1);
    expect(fitScale(440, 720, 80)).toBeCloseTo(0.5);
  });

  it('never scales a design up to fill a taller viewport', () => {
    expect(fitScale(2000, 720)).toBe(1);
  });

  it('falls back to full size before the viewport has been measured', () => {
    expect(fitScale(0, 720)).toBe(1);
    expect(fitScale(800, 0)).toBe(1);
  });

  it('does not go negative when the reserve swallows the whole viewport', () => {
    expect(fitScale(60, 720, 80)).toBe(0);
  });
});

describe('headerHeight', () => {
  it('reads the height the stylesheet declares', () => {
    document.documentElement.style.setProperty('--header-height', '72px');
    expect(headerHeight()).toBe(72);
    document.documentElement.style.removeProperty('--header-height');
  });

  it('reserves nothing when the variable is absent, rather than NaN', () => {
    expect(headerHeight()).toBe(0);
  });
});
