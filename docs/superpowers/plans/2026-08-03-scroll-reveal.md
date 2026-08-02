# Scroll Reveal Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Секции Location, Dress code, RSVP и Footer проявляют своё содержимое при попадании в кадр — прозрачность плюс короткий подъём, по очереди между элементами.

**Architecture:** Один модуль `src/reveal.ts` находит контейнеры с `data-reveal-group`, собирает внутри них элементы с `data-reveal` и на каждый контейнер вешает одноразовый `inView` из Motion, который анимирует его элементы со стаггером. Стартовое (скрытое) состояние живёт в CSS за классом `js-reveal`, который ставит сам модуль, — без работающего JS ничего не прячется.

**Tech Stack:** TypeScript, Vite, Vitest + jsdom, `motion` 12.43.0 (уже установлен).

Спека: `docs/superpowers/specs/2026-08-03-scroll-reveal-design.md`

## Global Constraints

- Секции `#greeting`, `#bouquet`, `#timeline`, `#final` НЕ трогаем — у них своя скролл-механика.
- Двигаем CSS-свойство `translate`, а не `transform`: элементы Location и Dress code центрируются через `transform: translateX(-50%)`, и анимация `transform` затёрла бы центрирование.
- Проверку `prefers-reduced-motion` берём из существующего `prefersReducedMotion()` в `src/scroll.ts`, свою не пишем.
- Значения: `STAGGER_STEP = 0.08` с, `DURATION = 0.7` с, `SHIFT = '0 24px'`, `AMOUNT = 0.15`, `ease = [0.22, 1, 0.36, 1]`.
- Комментарии в коде — на английском, как во всех остальных модулях проекта.
- Тесты запускаются `npm test` (vitest run, окружение jsdom).

## File Structure

- `src/reveal.ts` (создать) — сбор групп, тайминг, запуск анимаций.
- `src/reveal.test.ts` (создать) — тесты чистой логики.
- `src/reveal.css` (создать) — стартовое состояние за классом `js-reveal`.
- `src/main.ts` (изменить) — импорт стилей и вызов `initReveals()`.
- `index.html` (изменить) — атрибуты `data-reveal-group` / `data-reveal`.
- `package.json` — `motion` уже добавлен в зависимости, ставить повторно не нужно.

---

### Task 1: Тайминг и сбор групп

**Files:**
- Create: `src/reveal.ts`
- Test: `src/reveal.test.ts`

**Interfaces:**
- Consumes: ничего.
- Produces: `STAGGER_STEP: number`, `DURATION: number`, `SHIFT: string`, `AMOUNT: number`, `interface RevealGroup { root: HTMLElement; targets: HTMLElement[] }`, `revealDelay(index: number): number`, `collectGroups(root: ParentNode): RevealGroup[]`.

- [ ] **Step 1: Написать падающий тест**

Создать `src/reveal.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { STAGGER_STEP, collectGroups, revealDelay } from './reveal';

function mount(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

describe('revealDelay', () => {
  it('lets the first element start immediately', () => {
    expect(revealDelay(0)).toBe(0);
  });

  it('spaces the rest a step apart', () => {
    expect(revealDelay(1)).toBeCloseTo(STAGGER_STEP);
    expect(revealDelay(3)).toBeCloseTo(STAGGER_STEP * 3);
  });
});

describe('collectGroups', () => {
  it('reads a group in document order', () => {
    const root = mount(`
      <section data-reveal-group>
        <p id="a" data-reveal></p>
        <p id="b" data-reveal></p>
        <p id="c" data-reveal></p>
      </section>
    `);
    const groups = collectGroups(root);
    expect(groups).toHaveLength(1);
    expect(groups[0].targets.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('keeps each group on its own schedule', () => {
    const root = mount(`
      <section data-reveal-group><p id="a" data-reveal></p></section>
      <section data-reveal-group><p id="b" data-reveal></p></section>
    `);
    const groups = collectGroups(root);
    expect(groups.map((g) => g.targets.map((t) => t.id))).toEqual([['a'], ['b']]);
  });

  it('reports the container alongside its targets', () => {
    const root = mount(`<section id="s" data-reveal-group><p data-reveal></p></section>`);
    expect(collectGroups(root)[0].root.id).toBe('s');
  });

  it('drops a group with nothing marked inside it', () => {
    const root = mount(`<section data-reveal-group><p></p></section>`);
    expect(collectGroups(root)).toEqual([]);
  });

  it('leaves a nested group to itself', () => {
    const root = mount(`
      <section id="outer" data-reveal-group>
        <p id="a" data-reveal></p>
        <div id="inner" data-reveal-group>
          <p id="b" data-reveal></p>
        </div>
      </section>
    `);
    const groups = collectGroups(root);
    expect(groups.map((g) => g.targets.map((t) => t.id))).toEqual([['a'], ['b']]);
  });

  it('is happy with a document that has no groups at all', () => {
    expect(collectGroups(mount('<p>plain</p>'))).toEqual([]);
  });
});
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
npx vitest run src/reveal.test.ts
```

Ожидается: FAIL — `Failed to resolve import "./reveal"`.

- [ ] **Step 3: Написать минимальную реализацию**

Создать `src/reveal.ts`:

```ts
/**
 * Sections that scroll past without a scrub of their own bring their contents
 * in one element at a time: a short rise with a fade, in document order.
 */

/** Seconds between one element starting and the next. */
export const STAGGER_STEP = 0.08;

/** Seconds a single element takes to arrive. */
export const DURATION = 0.7;

/**
 * How far an element starts below its resting place. This is `translate`
 * rather than `transform` because most of these elements are centred with
 * `transform: translateX(-50%)`; the two properties compose, so animating
 * `translate` leaves the centring alone.
 */
export const SHIFT = '0 24px';

/** How much of a group must be in the frame before it starts. */
export const AMOUNT = 0.15;

export interface RevealGroup {
  root: HTMLElement;
  targets: HTMLElement[];
}

export function revealDelay(index: number): number {
  return index * STAGGER_STEP;
}

export function collectGroups(root: ParentNode): RevealGroup[] {
  const groups: RevealGroup[] = [];

  for (const group of root.querySelectorAll<HTMLElement>('[data-reveal-group]')) {
    const targets = [...group.querySelectorAll<HTMLElement>('[data-reveal]')].filter(
      // A nested group runs on its own schedule, so its members stay out of
      // this one rather than being staggered twice.
      (target) => target.closest('[data-reveal-group]') === group,
    );
    if (targets.length > 0) groups.push({ root: group, targets });
  }

  return groups;
}
```

- [ ] **Step 4: Запустить тест и убедиться, что он проходит**

```bash
npx vitest run src/reveal.test.ts
```

Ожидается: PASS, 8 тестов.

- [ ] **Step 5: Коммит**

```bash
git add src/reveal.ts src/reveal.test.ts package.json package-lock.json
git commit -m "Add reveal group collection and stagger timing"
```

---

### Task 2: Запуск анимаций и стартовое состояние

**Files:**
- Modify: `src/reveal.ts`
- Modify: `src/reveal.test.ts`
- Create: `src/reveal.css`

**Interfaces:**
- Consumes: `collectGroups`, `revealDelay`, `STAGGER_STEP`, `DURATION`, `SHIFT`, `AMOUNT` из Task 1; `prefersReducedMotion(): boolean` из `src/scroll.ts`.
- Produces: `initReveals(root?: ParentNode): void`.

- [ ] **Step 1: Написать падающий тест**

Дописать в конец `src/reveal.test.ts` (импорт в первой строке файла расширить до `import { STAGGER_STEP, collectGroups, initReveals, revealDelay } from './reveal';`, а `describe`/`expect`/`it` дополнить `afterEach`):

```ts
describe('initReveals', () => {
  afterEach(() => {
    document.documentElement.classList.remove('js-reveal');
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('does not arm anything when the visitor asked for less motion', () => {
    // jsdom has no matchMedia of its own, so the stub is the whole query.
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: true }),
    });

    initReveals(mount(`<section data-reveal-group><p data-reveal></p></section>`));

    expect(document.documentElement.classList.contains('js-reveal')).toBe(false);
  });

  it('stays quiet on a page with nothing to reveal', () => {
    initReveals(mount('<p>plain</p>'));

    expect(document.documentElement.classList.contains('js-reveal')).toBe(false);
  });
});
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

```bash
npx vitest run src/reveal.test.ts
```

Ожидается: FAIL — `initReveals is not a function` (или ошибка импорта отсутствующего экспорта).

- [ ] **Step 3: Написать реализацию**

В начало `src/reveal.ts` добавить импорты:

```ts
import { animate, inView, stagger } from 'motion';
import { prefersReducedMotion } from './scroll';
```

В конец `src/reveal.ts` добавить:

```ts
/**
 * Hands an element back to the stylesheet: Motion's inline values and the
 * attribute that hid it in the first place both go, so nothing it wrote
 * outlives the animation.
 */
function settle(target: HTMLElement): void {
  target.style.removeProperty('opacity');
  target.style.removeProperty('translate');
  target.removeAttribute('data-reveal');
}

function reveal({ root, targets }: RevealGroup): void {
  const stop = inView(
    root,
    () => {
      // Once is enough: the section keeps its contents on the way back up.
      stop();
      animate(
        targets,
        { opacity: [0, 1], translate: [SHIFT, '0 0px'] },
        { delay: stagger(STAGGER_STEP), duration: DURATION, ease: [0.22, 1, 0.36, 1] },
      ).finished.then(() => {
        for (const target of targets) settle(target);
      });
    },
    { amount: AMOUNT },
  );
}

export function initReveals(root: ParentNode = document): void {
  // Reduced motion is answered by doing nothing at all: without `js-reveal`
  // the stylesheet never hides anything, so the page reads as it does today.
  if (prefersReducedMotion()) return;

  const groups = collectGroups(root);
  if (groups.length === 0) return;

  document.documentElement.classList.add('js-reveal');
  for (const group of groups) reveal(group);
}
```

Создать `src/reveal.css`:

```css
/*
  The starting state is gated behind `js-reveal`, which reveal.ts adds itself.
  If the module never runs — a failed load, or a visitor who asked for reduced
  motion — nothing here applies and the page stays readable.
*/
.js-reveal [data-reveal] {
  opacity: 0;
  translate: 0 24px;
  will-change: opacity, translate;
}
```

- [ ] **Step 4: Запустить тесты и убедиться, что они проходят**

```bash
npm test
```

Ожидается: PASS по всем файлам, включая 10 тестов в `src/reveal.test.ts`.

- [ ] **Step 5: Коммит**

```bash
git add src/reveal.ts src/reveal.test.ts src/reveal.css
git commit -m "Reveal a section's elements when it scrolls into the frame"
```

---

### Task 3: Разметка и подключение

**Files:**
- Modify: `index.html` (секции `#location` 114-155, `#dress-code` 157-170, `#rsvp` 172-220, `.site-footer` 231-234)
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `initReveals()` из Task 2.
- Produces: ничего для последующих задач.

- [ ] **Step 1: Разметить Location**

В `index.html` заменить открывающий тег и пометить элементы:

```html
    <section class="location" id="location" data-reveal-group>
      <p class="location__label" data-reveal>Where?</p>
      <h2 class="location__title" data-reveal>Location</h2>
```

Далее в той же секции добавить `data-reveal` на: `<div class="location__address" id="location-address">`, `<div class="location__venue">`, `<div class="location__actions">` и `<img class="location__divider" …>`. Внутренности `location__actions` не помечаем — две кнопки выходят вместе.

- [ ] **Step 2: Разметить Dress code**

```html
    <section class="dress-code" id="dress-code" data-reveal-group>
      <p class="dress-code__label" data-reveal>What to wear</p>
      <h2 class="dress-code__title" data-reveal>Dress code</h2>

      <img class="dress-code__guests" src="/icons/dress-code.webp" alt="Guests in formal evening wear" data-reveal />

      <div class="dress-code__text" data-reveal>
```

Блок текста выходит целиком: правило и заметки читаются как одно, дробить их по времени незачем.

- [ ] **Step 3: Разметить RSVP и Footer**

RSVP — два шага, форма целиком:

```html
    <section class="rsvp" id="rsvp" data-reveal-group>
      <div class="rsvp__intro" data-reveal>
```

и на тег `<form class="rsvp__card rsvp__form" id="rsvp-form" …>` добавить `data-reveal` (последним атрибутом перед `novalidate`).

Footer:

```html
    <footer class="site-footer" data-reveal-group>
      <p class="site-footer__title" data-reveal>Wedding Day</p>
      <img class="site-footer__ornament" src="/icons/footer-ornament.svg" alt="" data-reveal />
    </footer>
```

- [ ] **Step 4: Подключить модуль**

В `src/main.ts` добавить `import './reveal.css';` последней строкой среди импортов стилей (после `./footer.css`), `import { initReveals } from './reveal';` после `import { initFinal } from './final';`, и `initReveals();` последней строкой файла — после `initFinal()`, чтобы секции успели выставить свою геометрию.

- [ ] **Step 5: Проверить сборку и тесты**

```bash
npm run build && npm test
```

Ожидается: сборка без ошибок TypeScript, все тесты зелёные.

- [ ] **Step 6: Проверить в браузере**

Поднять dev-сервер через preview_start и проскроллить до каждой из четырёх секций. Проверить по очереди:

1. Элементы выходят один за другим снизу вверх, а не все разом.
2. Заголовки и картинки Location/Dress code остаются по центру — если что-то уехало вправо, значит `translate` всё-таки затирает центрирование и это надо чинить, а не принимать.
3. После ухода секции из кадра и возврата в него содержимое остаётся на месте и не проигрывается заново.
4. В консоли нет ошибок; в DevTools у отработавших элементов нет инлайновых `opacity`/`translate` и нет атрибута `data-reveal`.

- [ ] **Step 7: Коммит**

```bash
git add index.html src/main.ts
git commit -m "Reveal the location, dress code, RSVP and footer sections on scroll"
```

---

## Self-Review

**Покрытие спеки:** объём (4 блока) — Task 3; библиотека и параметры анимации — Task 2; разметка — Task 3; модуль и его экспорты — Tasks 1-2; защита от «пустой страницы» через `js-reveal` — Task 2; reduced motion — Task 2; тесты — Tasks 1-2; ручная проверка — Task 3 Step 6. Пробелов нет.

**Заглушки:** нет — в каждом шаге, меняющем код, приведён сам код.

**Согласованность типов:** `RevealGroup { root, targets }` объявлен в Task 1 и используется в `reveal()` и `initReveals()` в Task 2 под теми же именами полей. `SHIFT` — строка `'0 24px'`, парная ей конечная точка `'0 0px'`, оба уходят в CSS-свойство `translate`, которое в `transformPropOrder` Motion отсутствует.
