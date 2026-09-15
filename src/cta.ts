import { onScrollFrame } from './scroll';

/** How far the page has to move before the buy bar joins the visitor. */
export const CTA_REVEAL_AT = 24;

/**
 * Whether the buy bar should be on screen.
 *
 * It waits for the page to move because the opening screen already has a label
 * on that edge — the hero's "Scroll down" — and two of them stacked there read
 * as a mistake. Once shown it never hides again: it is shown at the footer, on
 * purpose, which is the one place a visitor is looking for the price.
 */
export function shouldShowCta(scrollY: number, shown: boolean): boolean {
  return shown || scrollY > CTA_REVEAL_AT;
}

export function initCta(): void {
  const cta = document.getElementById('cta');
  if (!cta) return;

  let shown = false;

  onScrollFrame(() => {
    if (shown) return;
    shown = shouldShowCta(window.scrollY, shown);
    if (shown) cta.classList.add('cta--shown');
  });
}
