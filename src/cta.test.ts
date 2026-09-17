import { describe, expect, it } from 'vitest';
import { CTA_REVEAL_AT, isEmbedded, shouldShowCta } from './cta';

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

describe('isEmbedded', () => {
  /* The portal's gallery frames this page. Whoever is looking there has bought
     one already, so the bar offering to sell them one is noise. */
  it('knows the page is being framed by us', () => {
    expect(isEmbedded('?embed=1')).toBe(true);
    expect(isEmbedded('?embed')).toBe(true);
  });

  it('leaves an ordinary visit alone', () => {
    expect(isEmbedded('')).toBe(false);
    expect(isEmbedded('?utm_source=instagram')).toBe(false);
  });
});
