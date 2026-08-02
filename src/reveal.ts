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
