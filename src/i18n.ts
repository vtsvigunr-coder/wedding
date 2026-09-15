/**
 * The invitation's words. Every visible string lives here, keyed by the
 * `data-i18n*` attributes in the markup, so a change of copy is a dictionary
 * entry rather than a hunt through the sections.
 *
 * The invitation is written in English alone. It carried Russian and Uzbek
 * behind a switcher until the site settled on one language; the table stayed,
 * because the markup is keyed to it and a single place to edit the wording is
 * worth keeping.
 *
 * Two things deliberately stay out of this table:
 *
 * - The RSVP radios' `value`s, which are what Google Forms records. Only the
 *   labels beside them are copy.
 * - The map search, which lives in `data-maps-query` on the address. The
 *   printed address is copy; the query that finds the place is not.
 *
 * Keys read through `data-i18n-html` carry markup — a line break. The applier
 * checks the key against this table before it will write any, so the only
 * markup that can ever reach `innerHTML` is markup written here.
 */

export const LANG = 'en';

export type Dictionary = Record<string, string>;

export const strings: Dictionary = {
  'doc.title': 'Zohan & Rose — Invitation',

  'header.home': 'Invitated',
  'header.sound': 'Toggle music',

  'preloader.click': 'Click',
  'preloader.scroll': 'Scroll down',
  'preloader.label': 'Wedding Day',

  'greeting.label': 'Our wedding day',
  'greeting.title': 'Dear guest !',
  'greeting.envelope': 'An envelope opening to reveal the invitation',

  'bouquet.label': 'Wedding date',
  'bouquet.title': 'When?',
  'bouquet.month': 'September',
  'bouquet.time': '16:00',

  'timeline.title': 'Program',
  'timeline.1.hour': '3 PM',
  'timeline.1.what': 'Guest arrival',
  'timeline.2.hour': '4 PM',
  'timeline.2.what': 'Photoshoot',
  'timeline.3.hour': '5 PM',
  'timeline.3.what': 'The start of<br />the celebration',
  'timeline.4.hour': '6 PM',
  'timeline.4.what': 'Wedding',
  'timeline.5.hour': '9 PM',
  'timeline.5.what': 'The End of the Wedding',

  'location.label': 'Where?',
  'location.title': 'Location',
  'location.venue': 'Grand Celebration Hall',
  'location.street': '11th Avenue, New York State',
  'location.venueAlt': 'The venue',
  'location.directions': 'Get directions',
  'location.calendar': 'Calendar',
  'location.event': 'Zohan & Rose — Wedding',

  'dress.label': 'What to wear',
  'dress.title': 'Dress code',
  'dress.rule': 'formal • black tie',
  'dress.note1': 'Tuxedo or dark suit for gentlemen. Long or<br />cocktail dress for ladies.',
  'dress.note2': 'We kindly ask you to avoid wearing white. Shine with us!',
  'dress.guestsAlt': 'Guests in formal evening wear',

  'rsvp.title': 'Confirm your attendance',
  'rsvp.lead': 'Please let us know<br />if you can come.',
  'rsvp.question': 'Will you be able to come?',
  'rsvp.yes': 'Yes, with pleasure!',
  'rsvp.no': "Unfortunately, I can't.",
  'rsvp.name': 'Your first and last name',
  'rsvp.namePlaceholder': 'Alexei',
  'rsvp.message': 'Message (optional)',
  'rsvp.send': 'Send',
  'rsvp.needAnswer': 'Please tell us whether you can come.',
  'rsvp.needName': 'Please tell us your name.',
  'rsvp.notConnected': 'The form is not connected yet — please tell the couple directly.',
  'rsvp.sending': 'Sending…',
  'rsvp.sent': 'Thank you! Your answer is on its way to us.',
  'rsvp.failed': 'That did not go through. Please try again in a moment.',

  'final.wish': 'We would be happy to share<br />this day together.',
  'final.names': 'Zohan & Rose',

  'cta.note': 'Your own invitation like this one',
  'cta.buy': 'Get yours',

  'footer.up': 'Back to the top',
};

/**
 * A string from the table. Falls back to the key itself — a missing entry
 * should read oddly, never blank the element.
 */
export function t(key: string): string {
  return strings[key] ?? key;
}

/**
 * `attr:key` pairs, separated by `;` — `aria-label:header.sound`. Anything
 * malformed is skipped rather than written as an attribute called nothing.
 */
function applyAttrs(element: HTMLElement, spec: string): void {
  for (const pair of spec.split(';')) {
    const [attr, key] = pair.split(':').map((part) => part.trim());
    if (!attr || !key) continue;
    element.setAttribute(attr, t(key));
  }
}

export function applyStrings(root: ParentNode = document): void {
  document.documentElement.lang = LANG;
  document.title = t('doc.title');

  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n ?? '');
  }

  // These carry line breaks, so they are written as markup. Only a key that is
  // actually in the table above is allowed through as HTML: an unknown one
  // falls back to text, so nothing outside this file can ever reach innerHTML.
  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n-html]')) {
    const key = element.dataset.i18nHtml ?? '';
    const known = strings[key];
    if (known === undefined) {
      element.textContent = key;
    } else {
      element.innerHTML = known;
    }
  }

  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n-attr]')) {
    applyAttrs(element, element.dataset.i18nAttr ?? '');
  }
}

export function initI18n(): void {
  applyStrings();
}
