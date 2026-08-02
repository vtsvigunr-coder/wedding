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

export function clamp01(value: number): number {
  // `value > 0` rather than `value >= 0` so a negative zero — which -top
  // produces the moment a stage pins — normalises to plain zero.
  if (!(value > 0)) return 0;
  return value > 1 ? 1 : value;
}
