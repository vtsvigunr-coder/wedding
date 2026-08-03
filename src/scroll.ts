type ScrollSubscriber = () => void;

const subscribers = new Set<ScrollSubscriber>();
let scheduled = false;
let listening = false;

function flush(): void {
  scheduled = false;
  for (const subscriber of subscribers) subscriber();
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(flush);
}

/**
 * Runs `subscriber` at most once per animation frame while the page scrolls or
 * resizes. Everything scroll-driven shares one loop and one set of listeners so
 * the sections never fight each other for frames.
 */
export function onScrollFrame(subscriber: ScrollSubscriber): () => void {
  subscribers.add(subscriber);
  if (!listening) {
    listening = true;
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  }
  subscriber();
  return () => {
    subscribers.delete(subscriber);
  };
}

/** True when the visitor asked for reduced motion, so scrubbing is skipped. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * What the fixed header covers, read from the stylesheet so the two never
 * drift apart. Pinned stages shrink to fit the space below it — without that
 * their titles ride up under the header on short screens, and the script
 * face's ascenders, which already overhang their line box, get clipped.
 */
export function headerHeight(): number {
  const declared = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
  const parsed = Number.parseFloat(declared);
  return Number.isFinite(parsed) ? parsed : 0;
}

let probe: HTMLElement | null = null;

/**
 * The height of the *small* viewport — the one a mobile browser leaves once its
 * own chrome is showing.
 *
 * `window.innerHeight` is not that: on iOS Safari it swells and shrinks by the
 * height of the URL bar as the page is scrolled, and every resize it fires on
 * the way rewrites the pinned stages' `--fit`, so the envelope and the
 * programme visibly grow and snap back mid-scroll. `100svh` is defined to stay
 * put through exactly that, so the stages are measured against a probe holding
 * it instead. Falls back to `innerHeight` where `svh` is not understood.
 */
export function stableViewportHeight(): number {
  if (!CSS.supports?.('height', '100svh')) return window.innerHeight;
  if (!probe?.isConnected) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
    document.body.append(probe);
  }
  return probe.getBoundingClientRect().height || window.innerHeight;
}

/**
 * How much a stage `designHeight` tall has to shrink to fit a viewport once
 * `reserved` is kept clear at the top. Never scales up: the design's own size
 * is the ceiling.
 */
export function fitScale(viewportHeight: number, designHeight: number, reserved = 0): number {
  if (!(viewportHeight > 0) || !(designHeight > 0)) return 1;
  const room = Math.max(0, viewportHeight - reserved);
  return Math.min(1, room / designHeight);
}

export function clamp01(value: number): number {
  // `value > 0` rather than `value >= 0` so a negative zero — which -top
  // produces the moment a stage pins — normalises to plain zero.
  if (!(value > 0)) return 0;
  return value > 1 ? 1 : value;
}
