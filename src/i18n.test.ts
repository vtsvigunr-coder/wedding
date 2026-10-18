import { describe, expect, it } from 'vitest';
import { applyStrings, languageAt, strings, t } from './i18n';
import { ru } from './i18n-ru';

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

describe('the Russian site', () => {
  it('reads Russian at invitated.com/ru/hira-azain/', () => {
    expect(languageAt('/ru/hira-azain/', '')).toBe('ru');
  });

  it('reads Russian anywhere with ?lang=ru, to try it', () => {
    expect(languageAt('/', '?lang=ru')).toBe('ru');
  });

  it('stays English at its own address', () => {
    expect(languageAt('/hira-azain/', '')).toBe('en');
  });

  it('has every word in Russian', () => {
    const missing = Object.keys(strings).filter((key) => !ru[key]?.trim());
    expect(missing).toEqual([]);
  });

  it('keeps the markup English carries', () => {
    const tags = (value: string) => (value.match(/<\/?[a-z0-9]+/gi) ?? []).join();
    expect(Object.keys(ru).filter((key) => tags(ru[key]) !== tags(strings[key] ?? ''))).toEqual([]);
  });

  it('writes Russian into the page and says so', () => {
    document.body.innerHTML = '<h2 data-i18n="bouquet.title"></h2>';
    applyStrings(document, 'ru');
    expect(document.querySelector('h2')?.textContent).toBe(ru['bouquet.title']);
    expect(document.documentElement.lang).toBe('ru');
  });
});

describe('the page', () => {
  it('keys every name and credit it shows', async () => {
    const html = (await import('../index.html?raw')).default;
    for (const key of ['preloader.first', 'preloader.second', 'footer.credit']) {
      expect(html, key).toContain(`"${key}"`);
      expect(ru[key], key).toBeTruthy();
    }
  });
});

describe('the way home', () => {
  it('goes to the Russian site from the Russian page', async () => {
    const html = (await import('../index.html?raw')).default;
    expect(html).toContain('href:header.homeLink');
    expect(t('header.homeLink', 'ru')).toBe('https://www.invitated.com/ru');
    expect(t('header.homeLink', 'en')).toBe('https://www.invitated.com');
  });
});
