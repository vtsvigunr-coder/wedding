// src/header.test.ts
import { describe, expect, it } from 'vitest';
import { nextHeaderVisible } from './header';

describe('nextHeaderVisible', () => {
  it('stays visible at the very top of the page', () => {
    expect(nextHeaderVisible(0, 0, true)).toBe(true);
  });

  it('hides once scrolling down past the top', () => {
    expect(nextHeaderVisible(0, 40, true)).toBe(false);
  });

  it('stays hidden while continuing to scroll down', () => {
    expect(nextHeaderVisible(200, 240, false)).toBe(false);
  });

  it('shows again when scrolling up', () => {
    expect(nextHeaderVisible(240, 200, false)).toBe(true);
  });

  it('shows when scrolled back to the top even if moving up slowly', () => {
    expect(nextHeaderVisible(10, 0, false)).toBe(true);
  });
});
