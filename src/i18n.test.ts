import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LANG,
  LANGS,
  LANG_LABELS,
  applyLang,
  isLang,
  pickLang,
  t,
  translations,
} from './i18n';

function mount(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

describe('pickLang', () => {
  it('takes the visitor back to the language they chose', () => {
    expect(pickLang('ru')).toBe('ru');
    expect(pickLang('uz')).toBe('uz');
  });

  it('falls back to the default for anything it does not recognise', () => {
    expect(pickLang(null)).toBe(DEFAULT_LANG);
    expect(pickLang('')).toBe(DEFAULT_LANG);
    expect(pickLang('klingon')).toBe(DEFAULT_LANG);
  });
});

describe('isLang', () => {
  it('accepts the languages on offer and nothing else', () => {
    expect(isLang('en')).toBe(true);
    expect(isLang('de')).toBe(false);
    expect(isLang(null)).toBe(false);
    expect(isLang(7)).toBe(false);
  });
});

describe('translations', () => {
  it('offers a label for every language the switcher can reach', () => {
    for (const lang of LANGS) expect(LANG_LABELS[lang]).toBeTruthy();
  });

  it('carries the same keys in every language', () => {
    const expected = Object.keys(translations[DEFAULT_LANG]).sort();
    for (const lang of LANGS) {
      expect({ lang, keys: Object.keys(translations[lang]).sort() }).toEqual({ lang, keys: expected });
    }
  });

  it('leaves nothing blank', () => {
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(translations[lang])) {
        expect({ lang, key, empty: value.trim() === '' }).toEqual({ lang, key, empty: false });
      }
    }
  });

  it('writes Uzbek with the quote mark the fonts actually carry', () => {
    // The fonts have no U+02BB, so `oʻ`/`gʻ` are written with U+2019 instead.
    // A stray U+02BB would render as a blank box on the page.
    for (const [key, value] of Object.entries(translations.uz)) {
      expect({ key, hasTurnedComma: value.includes('ʻ') }).toEqual({ key, hasTurnedComma: false });
    }
  });

  it('keeps the reply options identical across languages, since Google records them', () => {
    // Only the visible labels are translated; the radios' `value`s are not in
    // this table at all, which is what keeps the recorded answers consistent.
    expect(translations.en['rsvp.yes']).not.toBe(translations.ru['rsvp.yes']);
    expect(translations.ru['rsvp.yes']).not.toBe(translations.uz['rsvp.yes']);
  });
});

describe('t', () => {
  it('returns the string for the language asked for', () => {
    expect(t('footer.title', 'en')).toBe('Wedding Day');
    expect(t('footer.title', 'ru')).toBe('День свадьбы');
  });

  it('falls back to the key itself rather than blanking the element', () => {
    expect(t('nothing.here', 'ru')).toBe('nothing.here');
  });
});

describe('applyLang', () => {
  it('fills text nodes from their key', () => {
    const root = mount('<p data-i18n="footer.title">Wedding Day</p>');
    applyLang('ru', root);
    expect(root.querySelector('p')?.textContent).toBe('День свадьбы');
  });

  it('keeps the line breaks in the strings that carry them', () => {
    const root = mount('<p data-i18n-html="final.wish"></p>');
    applyLang('ru', root);
    expect(root.querySelector('br')).not.toBeNull();
  });

  it('never lets an unknown key reach innerHTML', () => {
    const root = mount('<p data-i18n-html="&lt;img src=x onerror=alert(1)&gt;"></p>');
    applyLang('en', root);
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('p')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('translates the attributes it is pointed at', () => {
    const root = mount('<input data-i18n-attr="placeholder:rsvp.namePlaceholder" />');
    applyLang('ru', root);
    expect(root.querySelector('input')?.getAttribute('placeholder')).toBe('Алексей');
  });

  it('handles several attributes on one element', () => {
    const root = mount('<img data-i18n-attr="alt:location.venueAlt;title:location.title" />');
    applyLang('en', root);
    const img = root.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('The venue');
    expect(img?.getAttribute('title')).toBe('Location');
  });

  it('skips a malformed attribute pair instead of writing a nameless one', () => {
    const root = mount('<img data-i18n-attr="alt:location.venueAlt;;broken" />');
    expect(() => applyLang('en', root)).not.toThrow();
    expect(root.querySelector('img')?.getAttribute('alt')).toBe('The venue');
  });

  it('tells the page which language it is in, for screen readers and hyphenation', () => {
    applyLang('uz', mount(''));
    expect(document.documentElement.lang).toBe('uz');
    applyLang('en', mount(''));
    expect(document.documentElement.lang).toBe('en');
  });
});
