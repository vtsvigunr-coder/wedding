/**
 * The invitation in three languages. Every visible string lives here, keyed by
 * the `data-i18n*` attributes in the markup, so a translation is a dictionary
 * entry rather than a hunt through the sections.
 *
 * What deliberately does NOT move between languages:
 *
 * - The venue and its street. They are the answer to "where do I drive to",
 *   the map search is built from them, and a translated address searches worse
 *   than the printed one.
 * - The RSVP radios' `value`s. Those are what Google Forms records, so they
 *   stay in one language whatever the guest is reading; only the labels beside
 *   them change.
 */

export const LANGS = ['en', 'ru', 'uz'] as const;

export type Lang = (typeof LANGS)[number];

/** What the switcher prints for each language. */
export const LANG_LABELS: Record<Lang, string> = {
  en: 'EN',
  ru: 'РУ',
  uz: 'UZ',
};

export const DEFAULT_LANG: Lang = 'en';

export const STORAGE_KEY = 'invitation-lang';

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

/** The language to open in: whatever the visitor last chose, else the default. */
export function pickLang(stored: string | null): Lang {
  return isLang(stored) ? stored : DEFAULT_LANG;
}

export type Dictionary = Record<string, string>;

export const translations: Record<Lang, Dictionary> = {
  en: {
    'doc.title': 'Zohan & Rose — Invitation',

    'header.title': 'Invitation',
    'header.sound': 'Toggle music',
    'header.language': 'Change language',

    'preloader.click': 'Click',
    'preloader.scroll': 'Scroll down',

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

    'footer.title': 'Wedding Day',
    'footer.up': 'Back to the top',
  },

  ru: {
    'doc.title': 'Зохан и Роуз — приглашение',

    'header.title': 'Приглашение',
    'header.sound': 'Включить или выключить музыку',
    'header.language': 'Сменить язык',

    'preloader.click': 'Нажмите',
    'preloader.scroll': 'Листайте вниз',

    'greeting.label': 'Наш свадебный день',
    'greeting.title': 'Дорогой гость !',
    'greeting.envelope': 'Конверт, который открывается и показывает приглашение',

    'bouquet.label': 'Дата свадьбы',
    'bouquet.title': 'Когда?',
    'bouquet.month': 'сентября',
    'bouquet.time': '16:00',

    'timeline.title': 'Программа',
    'timeline.1.hour': '15:00',
    'timeline.1.what': 'Сбор гостей',
    'timeline.2.hour': '16:00',
    'timeline.2.what': 'Фотосессия',
    'timeline.3.hour': '17:00',
    'timeline.3.what': 'Начало<br />торжества',
    'timeline.4.hour': '18:00',
    'timeline.4.what': 'Церемония',
    'timeline.5.hour': '21:00',
    'timeline.5.what': 'Завершение вечера',

    'location.label': 'Где?',
    'location.title': 'Место',
    'location.venueAlt': 'Место проведения',
    'location.directions': 'Построить маршрут',
    'location.calendar': 'В календарь',
    'location.event': 'Зохан и Роуз — свадьба',

    'dress.label': 'Что надеть',
    'dress.title': 'Дресс-код',
    'dress.rule': 'строгий • black tie',
    'dress.note1': 'Смокинг или тёмный костюм для мужчин.<br />Длинное или коктейльное платье для женщин.',
    'dress.note2': 'Просим вас не надевать белое. Сияйте вместе с нами!',
    'dress.guestsAlt': 'Гости в вечерних нарядах',

    'rsvp.title': 'Подтвердите присутствие',
    'rsvp.lead': 'Сообщите нам,<br />сможете ли вы прийти.',
    'rsvp.question': 'Сможете ли вы прийти?',
    'rsvp.yes': 'Да, с удовольствием!',
    'rsvp.no': 'К сожалению, не смогу.',
    'rsvp.name': 'Ваши имя и фамилия',
    'rsvp.namePlaceholder': 'Алексей',
    'rsvp.message': 'Пожелание (необязательно)',
    'rsvp.send': 'Отправить',
    'rsvp.needAnswer': 'Отметьте, сможете ли вы прийти.',
    'rsvp.needName': 'Напишите, пожалуйста, ваше имя.',
    'rsvp.notConnected': 'Форма ещё не подключена — сообщите молодожёнам напрямую.',
    'rsvp.sending': 'Отправляем…',
    'rsvp.sent': 'Спасибо! Ваш ответ уже в пути.',
    'rsvp.failed': 'Не удалось отправить. Попробуйте ещё раз через минуту.',

    'final.wish': 'Будем рады разделить<br />этот день вместе.',
    'final.names': 'Зохан и Роуз',

    'footer.title': 'День свадьбы',
    'footer.up': 'Наверх',
  },

  uz: {
    'doc.title': 'Zohan va Rose — taklifnoma',

    'header.title': 'Taklifnoma',
    'header.sound': 'Musiqani yoqish yoki o’chirish',
    'header.language': 'Tilni o’zgartirish',

    'preloader.click': 'Bosing',
    'preloader.scroll': 'Pastga suring',

    'greeting.label': 'Bizning to’y kunimiz',
    'greeting.title': 'Aziz mehmon !',
    'greeting.envelope': 'Ochilib, taklifnomani ko’rsatadigan konvert',

    'bouquet.label': 'To’y sanasi',
    'bouquet.title': 'Qachon?',
    'bouquet.month': 'sentabr',
    'bouquet.time': '16:00',

    'timeline.title': 'Dastur',
    'timeline.1.hour': '15:00',
    'timeline.1.what': 'Mehmonlar yig’ilishi',
    'timeline.2.hour': '16:00',
    'timeline.2.what': 'Fotosessiya',
    'timeline.3.hour': '17:00',
    'timeline.3.what': 'Bayram<br />boshlanishi',
    'timeline.4.hour': '18:00',
    'timeline.4.what': 'Nikoh marosimi',
    'timeline.5.hour': '21:00',
    'timeline.5.what': 'Kechaning yakuni',

    'location.label': 'Qayerda?',
    'location.title': 'Manzil',
    'location.venueAlt': 'To’y joyi',
    'location.directions': 'Yo’l ko’rsatish',
    'location.calendar': 'Kalendarga',
    'location.event': 'Zohan va Rose — to’y',

    'dress.label': 'Nima kiyish kerak',
    'dress.title': 'Dress-kod',
    'dress.rule': 'rasmiy • black tie',
    'dress.note1': 'Erkaklar uchun smoking yoki to’q rangli kostyum.<br />Ayollar uchun uzun yoki kokteyl libos.',
    'dress.note2': 'Oq kiyim kiymaslikni so’raymiz. Biz bilan porlang!',
    'dress.guestsAlt': 'Kechki liboslardagi mehmonlar',

    'rsvp.title': 'Ishtirokingizni tasdiqlang',
    'rsvp.lead': 'Kela olasizmi,<br />bizga xabar bering.',
    'rsvp.question': 'Kela olasizmi?',
    'rsvp.yes': 'Ha, bajonidil!',
    'rsvp.no': 'Afsuski, kela olmayman.',
    'rsvp.name': 'Ismingiz va familiyangiz',
    'rsvp.namePlaceholder': 'Alisher',
    'rsvp.message': 'Tilak (ixtiyoriy)',
    'rsvp.send': 'Yuborish',
    'rsvp.needAnswer': 'Kela olasizmi, belgilang.',
    'rsvp.needName': 'Iltimos, ismingizni yozing.',
    'rsvp.notConnected': 'Shakl hali ulanmagan — kelin-kuyovga to’g’ridan-to’g’ri ayting.',
    'rsvp.sending': 'Yuborilmoqda…',
    'rsvp.sent': 'Rahmat! Javobingiz bizga yetib bormoqda.',
    'rsvp.failed': 'Yuborib bo’lmadi. Bir oz o’tib yana urinib ko’ring.',

    'final.wish': 'Bu kunni birga<br />o’tkazishdan xursand bo’lamiz.',
    'final.names': 'Zohan va Rose',

    'footer.title': 'To’y kuni',
    'footer.up': 'Yuqoriga',
  },
};

/** The current language. Read by the modules that build strings in script. */
let current: Lang = DEFAULT_LANG;

export function currentLang(): Lang {
  return current;
}

/**
 * A translated string. Falls back to the default language, then to the key
 * itself — a missing entry should read oddly, never blank the element.
 */
export function t(key: string, lang: Lang = current): string {
  return translations[lang][key] ?? translations[DEFAULT_LANG][key] ?? key;
}

/**
 * `attr:key` pairs, separated by `;` — `aria-label:header.sound`. Anything
 * malformed is skipped rather than written as an attribute called nothing.
 */
function applyAttrs(element: HTMLElement, spec: string, lang: Lang): void {
  for (const pair of spec.split(';')) {
    const [attr, key] = pair.split(':').map((part) => part.trim());
    if (!attr || !key) continue;
    element.setAttribute(attr, t(key, lang));
  }
}

export function applyLang(lang: Lang, root: ParentNode = document): void {
  current = lang;
  document.documentElement.lang = lang;
  document.title = t('doc.title', lang);

  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n ?? '', lang);
  }

  // These carry line breaks, so they are written as markup. Only a key that is
  // actually in the table above is allowed through as HTML: an unknown one
  // falls back to text, so nothing outside this file can ever reach innerHTML.
  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n-html]')) {
    const key = element.dataset.i18nHtml ?? '';
    const known = translations[lang][key] ?? translations[DEFAULT_LANG][key];
    if (known === undefined) {
      element.textContent = key;
    } else {
      element.innerHTML = known;
    }
  }

  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n-attr]')) {
    applyAttrs(element, element.dataset.i18nAttr ?? '', lang);
  }
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode, or storage turned off. The default language still works.
    return null;
  }
}

function store(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Not being able to remember the choice is not a reason to refuse it.
  }
}

export function initI18n(): void {
  const root = document.getElementById('lang');
  const button = document.getElementById('lang-button');
  const menu = document.getElementById('lang-menu');
  const code = document.getElementById('lang-code');

  const select = (lang: Lang) => {
    applyLang(lang);
    store(lang);
    if (code) code.textContent = LANG_LABELS[lang];
    if (menu) {
      for (const option of menu.querySelectorAll<HTMLElement>('[data-lang]')) {
        option.setAttribute('aria-selected', String(option.dataset.lang === lang));
      }
    }
  };

  select(pickLang(readStored()));

  if (!root || !button || !menu) return;

  const close = () => {
    root.classList.remove('lang--open');
    button.setAttribute('aria-expanded', 'false');
  };

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = root.classList.toggle('lang--open');
    button.setAttribute('aria-expanded', String(open));
  });

  menu.addEventListener('click', (event) => {
    const option = (event.target as HTMLElement).closest<HTMLElement>('[data-lang]');
    if (!option || !isLang(option.dataset.lang)) return;
    select(option.dataset.lang);
    close();
  });

  document.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}
