/**
 * Sections that scroll past without a scrub of their own bring their contents
 * in one element at a time: a short rise with a fade, in document order.
 */

import { animate, inView, stagger } from 'motion';
import { prefersReducedMotion } from './scroll';

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
      // Settle elements on both success and interruption: a cancelled animation
      // must not leave them frozen mid-flight with Motion's inline values.
      const settleAll = () => {
        for (const target of targets) settle(target);
      };
      animate(
        targets,
        { opacity: [0, 1], translate: [SHIFT, '0 0px'] },
        { delay: stagger(STAGGER_STEP), duration: DURATION, ease: [0.22, 1, 0.36, 1] },
      ).finished.then(settleAll, settleAll);
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
