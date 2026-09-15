import { describe, expect, it } from 'vitest';
import { applyStrings, strings, t } from './i18n';

function mount(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

describe('strings', () => {
  it('leaves nothing blank', () => {
    for (const [key, value] of Object.entries(strings)) {
      expect({ key, empty: value.trim() === '' }).toEqual({ key, empty: false });
    }
  });
});

describe('t', () => {
  it('returns the string for a key it carries', () => {
    expect(t('preloader.scroll')).toBe('Scroll down');
  });

  it('falls back to the key itself rather than blanking the element', () => {
    expect(t('nothing.here')).toBe('nothing.here');
  });
});

describe('applyStrings', () => {
  it('fills text nodes from their key', () => {
    const root = mount('<p data-i18n="location.title">Location</p>');
    applyStrings(root);
    expect(root.querySelector('p')?.textContent).toBe('Location');
  });

  it('keeps the line breaks in the strings that carry them', () => {
    const root = mount('<p data-i18n-html="final.wish"></p>');
    applyStrings(root);
    expect(root.querySelector('br')).not.toBeNull();
  });

  it('never lets an unknown key reach innerHTML', () => {
    const root = mount('<p data-i18n-html="&lt;img src=x onerror=alert(1)&gt;"></p>');
    applyStrings(root);
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('p')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('translates the attributes it is pointed at', () => {
    const root = mount('<input data-i18n-attr="placeholder:rsvp.namePlaceholder" />');
    applyStrings(root);
    expect(root.querySelector('input')?.getAttribute('placeholder')).toBe('Alexei');
  });

  it('handles several attributes on one element', () => {
    const root = mount('<img data-i18n-attr="alt:location.venueAlt;title:location.title" />');
    applyStrings(root);
    const img = root.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('The venue');
    expect(img?.getAttribute('title')).toBe('Location');
  });

  it('skips a malformed attribute pair instead of writing a nameless one', () => {
    const root = mount('<img data-i18n-attr="alt:location.venueAlt;;broken" />');
    expect(() => applyStrings(root)).not.toThrow();
    expect(root.querySelector('img')?.getAttribute('alt')).toBe('The venue');
  });

  it('tells the page which language it is in, for screen readers and hyphenation', () => {
    applyStrings(mount(''));
    expect(document.documentElement.lang).toBe('en');
  });
});
