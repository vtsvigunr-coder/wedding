import { afterEach, describe, expect, it } from 'vitest';
import { collectGroups, initReveals } from './reveal';

function mount(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

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
