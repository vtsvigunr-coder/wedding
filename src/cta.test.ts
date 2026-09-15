import { describe, expect, it } from 'vitest';
import { CTA_REVEAL_AT, shouldShowCta } from './cta';

describe('shouldShowCta', () => {
  it('stays away on the opening screen, where the hero has its own label', () => {
    expect(shouldShowCta(0, false)).toBe(false);
    expect(shouldShowCta(CTA_REVEAL_AT, false)).toBe(false);
  });

  it('arrives once the page has actually moved', () => {
    expect(shouldShowCta(CTA_REVEAL_AT + 1, false)).toBe(true);
  });

  it('stays for good, including back at the top and over the footer', () => {
    expect(shouldShowCta(0, true)).toBe(true);
  });
});
