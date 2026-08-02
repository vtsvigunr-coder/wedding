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
