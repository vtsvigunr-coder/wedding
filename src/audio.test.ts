import { describe, expect, it } from 'vitest';
import { getSoundIconClass } from './audio';

describe('getSoundIconClass', () => {
  it('returns the playing class when music is playing', () => {
    expect(getSoundIconClass(true)).toBe('site-header__sound--playing');
  });

  it('returns an empty string when music is paused', () => {
    expect(getSoundIconClass(false)).toBe('');
  });
});
