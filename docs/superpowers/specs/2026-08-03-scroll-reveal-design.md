# Появление секций по скроллу

Дата: 2026-08-03

## Задача

Спокойные секции сайта появляются мгновенно, как только до них доскроллишь. Нужно, чтобы их содержимое проявлялось — сдержанный fade-up с лёгким сдвигом по очереди между элементами.

## Объём

Анимация добавляется в четыре блока:

- `#location`
- `#dress-code`
- `#rsvp`
- `.site-footer`

Секции `#greeting`, `#bouquet`, `#timeline` и `#final` не трогаем: у каждой уже есть собственная скролл-механика (скраб письма, подъём букета, ход машинки по маршруту, распускающиеся цветы финала). Дополнительное появление поверх неё дало бы два независимых источника прозрачности на одних и тех же элементах и сломало бы существующие тайминги.

## Библиотека

`motion` (npm), ванильная сборка Motion от авторов Framer Motion. Сам `framer-motion` требует React, которого в проекте нет; тянуть react + react-dom (~45 КБ gzip) ради появлений на четырёх блоках несоразмерно.

Из пакета используются `inView`, `animate` и `stagger`.

## Решение

### 1. Разметка

Контейнер получает `data-reveal-group`, элементы внутри — `data-reveal` в порядке появления:

```html
<section class="location" id="location" data-reveal-group>
  <p class="location__label" data-reveal>Where?</p>
  <h2 class="location__title" data-reveal>Location</h2>
  <div class="location__address" data-reveal>…</div>
  <div class="location__venue" data-reveal>…</div>
  <div class="location__actions" data-reveal>…</div>
  <img class="location__divider" src="/icons/divider.png" alt="" data-reveal />
</section>
```

Порядок появления читается прямо в вёрстке, а не в отдельном списке селекторов в TS.

Разбивка по блокам:

- **Location** — label, title, address, venue, actions, divider (6 шагов).
- **Dress code** — label, title, картинка гостей, блок текста (4 шага; `.dress-code__text` появляется целиком, чтобы правило и заметки не расползались по времени).
- **RSVP** — intro, форма (2 шага; форма — одним элементом, дробить поля не нужно).
- **Footer** — заголовок, орнамент (2 шага).

### 2. Модуль `src/reveal.ts`

```ts
export const STAGGER_STEP = 0.08;  // с между соседними элементами
export const DURATION = 0.7;       // с на элемент
export const SHIFT = 24;           // px подъёма
export const AMOUNT = 0.15;        // доля группы в кадре для старта

export function revealDelay(index: number): number
export function collectGroups(root: ParentNode): HTMLElement[][]
export function initReveals(root?: ParentNode): void
```

`initReveals()`:

1. Если `prefersReducedMotion()` — выходит немедленно, ничего не трогая.
2. Ставит `js-reveal` на `document.documentElement`.
3. Для каждой группы из `collectGroups()` вешает `inView(group, callback, { amount: AMOUNT })`; коллбэк анимирует элементы группы и сразу вызывает возвращённую `inView` функцию остановки, чтобы появление было одноразовым.

Анимация: `{ opacity: [0, 1], transform: ['translateY(24px)', 'none'] }`, `{ delay: stagger(STAGGER_STEP), duration: DURATION, ease: [0.22, 1, 0.36, 1] }`.

По завершении с каждого элемента снимаются инлайновые `opacity`/`transform`, оставленные Motion, и убирается атрибут `data-reveal`. Иначе инлайновый `transform: none` пережил бы анимацию и перебил бы существующие CSS-трансформы секций.

`collectGroups()` собирает элементы в порядке документа и не заглядывает во вложенные `data-reveal-group` (на сегодня вложенных нет, но правило фиксируем, чтобы поведение не зависело от будущей вёрстки). Группы без `data-reveal` внутри отбрасываются.

### 3. Стили `src/reveal.css`

```css
.js-reveal [data-reveal] {
  opacity: 0;
  transform: translateY(24px);
  will-change: opacity, transform;
}
```

Стартовое состояние включается только классом `js-reveal`, который ставит TS. Если модуль не выполнится — ошибка загрузки, отключённый JS, — контент останется видимым: скрывать элементы безусловным CSS нельзя.

`will-change` держится только до конца анимации: правило привязано к `[data-reveal]`, а модуль снимает этот атрибут по завершении — вместе с ним отваливается и стартовое состояние.

### 4. Подключение

`src/main.ts`: импорт `./reveal.css` в конце списка стилей и вызов `initReveals()` последним — после всех `init*`, чтобы секции успели выставить свою геометрию.

## Доступность

`prefers-reduced-motion: reduce` — единственная развилка: класс не ставится, `inView` не вешается, страница ведёт себя ровно как сейчас. Используется существующий `prefersReducedMotion()` из `src/scroll.ts`, а не собственная проверка.

## Тесты

`src/reveal.test.ts`, vitest + jsdom, как в остальных модулях. Покрывается чистая логика:

- `revealDelay` — нулевая задержка у первого элемента, шаг `STAGGER_STEP` дальше.
- `collectGroups` — порядок документа; несколько групп разделены; группа без `data-reveal` отброшена; элементы вложенной группы не утекают в родительскую.
- `initReveals` при `prefers-reduced-motion` не ставит `js-reveal` (через подмену `window.matchMedia`).
- `initReveals` на документе без групп не падает.

Само проигрывание анимации не тестируется: это работа Motion и IntersectionObserver, которого в jsdom нет.

## Проверка

`npm test` и прогон в браузере: проскроллить до каждой из четырёх секций и убедиться, что элементы выходят по очереди и остаются видимыми после ухода секции из кадра и возврата в него.
