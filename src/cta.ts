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

/**
 * Whether this page is being shown inside something of ours.
 *
 * In the portal's template gallery the bar is not an offer, it is a
 * distraction: whoever is looking has bought one already and is choosing
 * between designs. The gallery frames these pages with `?embed=1` for exactly
 * this, and the blurred strip the bar carries goes with it — it belongs to the
 * bar, not to the invitation.
 */
export function isEmbedded(search: string): boolean {
  return new URLSearchParams(search).has('embed');
}

export function initCta(): void {
  const cta = document.getElementById('cta');
  if (!cta) return;

  /* Taken out rather than left unshown: it is in the markup already, and
     something that is only ever one class away from appearing is something
     that will one day appear. */
  if (isEmbedded(window.location.search)) {
    cta.remove();
    return;
  }

  let shown = false;

  onScrollFrame(() => {
    if (shown) return;
    shown = shouldShowCta(window.scrollY, shown);
    if (shown) cta.classList.add('cta--shown');
  });
}
