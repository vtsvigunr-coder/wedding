import { clamp01, onScrollFrame, prefersReducedMotion } from './scroll';

export interface Point {
  x: number;
  y: number;
}

/** One drawn subpath, plus the direction the heart travels along it. */
export interface RouteSegment {
  length: number;
  reversed: boolean;
  pointAt(distance: number): Point;
}

/** How many points the route is flattened into. */
export const ROUTE_SAMPLES = 600;

/** How long a stop takes to fade in once the heart has reached it. */
export const STOP_FADE = 0.05;

/** The design's canvas; the frame is scaled down to fit shorter viewports. */
export const FRAME_HEIGHT = 782;

/**
 * How far the pinned stage has been scrolled through, 0 to 1. The stage is
 * taller than the viewport and the pin sticks for exactly the surplus, so the
 * heart makes its whole descent with the programme held still in front of the
 * visitor rather than while it is still sliding into view.
 */
export function timelineProgress(top: number, height: number, viewportHeight: number): number {
  const travel = height - viewportHeight;
  if (travel <= 0) return top <= 0 ? 1 : 0;
  return clamp01(-top / travel);
}

/** How much the frame has to shrink to fit a viewport shorter than the design. */
export function frameScale(viewportHeight: number): number {
  if (!(viewportHeight > 0)) return 1;
  return Math.min(1, viewportHeight / FRAME_HEIGHT);
}

/**
 * Flattens the route into evenly spaced points, walking the segments in order
 * and taking the reversed ones back to front.
 */
export function sampleRoute(segments: RouteSegment[], count = ROUTE_SAMPLES): Point[] {
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  if (total <= 0 || count < 1) return [];

  const points: Point[] = [];
  for (let i = 0; i <= count; i += 1) {
    let remaining = (i / count) * total;
    for (let s = 0; s < segments.length; s += 1) {
      const segment = segments[s];
      const last = s === segments.length - 1;
      if (!last && remaining > segment.length) {
        remaining -= segment.length;
        continue;
      }
      const distance = Math.min(remaining, segment.length);
      points.push(segment.pointAt(segment.reversed ? segment.length - distance : distance));
      break;
    }
  }
  return points;
}

/** The point the heart sits on at `progress` along the sampled route. */
export function pointAt(samples: Point[], progress: number): Point | null {
  if (samples.length === 0) return null;
  const index = Math.round(clamp01(progress) * (samples.length - 1));
  return samples[index];
}

/**
 * The progress at which the heart first descends to `y`. Stops use it so they
 * announce themselves as the heart draws level rather than on a fixed timer.
 * A height the route never reaches resolves to the very end.
 */
export function reachedAt(samples: Point[], y: number): number {
  if (samples.length < 2) return 1;
  for (let i = 0; i < samples.length; i += 1) {
    if (samples[i].y >= y) return i / (samples.length - 1);
  }
  return 1;
}

/** A stop fades in over a short window once the heart has reached it. */
export function stopReveal(progress: number, threshold: number): number {
  return clamp01((clamp01(progress) - threshold) / STOP_FADE);
}

function readSegments(svg: SVGSVGElement): RouteSegment[] {
  const paths = Array.from(svg.querySelectorAll<SVGPathElement>('.timeline__segment'));
  return paths.map((path) => ({
    length: path.getTotalLength(),
    reversed: path.dataset.reverse !== undefined,
    pointAt: (distance: number) => path.getPointAtLength(distance),
  }));
}

export function initTimeline(): void {
  const section = document.getElementById('timeline');
  const frame = document.getElementById('timeline-frame');
  const route = document.querySelector<HTMLElement>('.timeline__route');
  const svg = document.querySelector<SVGSVGElement>('.timeline__line');
  const lock = document.getElementById('timeline-lock');
  const stopsList = document.getElementById('timeline-stops');
  if (!section || !frame || !route || !svg || !lock || !stopsList) return;

  const stops = Array.from(stopsList.querySelectorAll<HTMLElement>('.timeline__stop'));

  let samples: Point[] = [];
  let thresholds: number[] = [];
  // The route is drawn in viewBox units and stretched to the container's box;
  // sampled points need the same stretch before they are usable as pixels.
  let scaleX = 1;
  let scaleY = 1;

  const measure = () => {
    frame.style.setProperty('--fit', String(frameScale(window.innerHeight)));
    samples = sampleRoute(readSegments(svg));
    // Layout sizes, not `getBoundingClientRect` — the frame's fit-to-viewport
    // scale already covers the lock, so measuring the scaled box would apply it
    // to every point a second time.
    const box = svg.viewBox.baseVal;
    scaleX = box.width > 0 ? route.offsetWidth / box.width : 1;
    scaleY = box.height > 0 ? route.offsetHeight / box.height : 1;
    // Stops carry the height, in the design's canvas coordinates, at which they
    // should appear; the route's own top edge is the offset between the two.
    thresholds = stops.map((stop) => {
      const reach = Number(stop.dataset.reach ?? 0) - route.offsetTop;
      return reachedAt(samples, scaleY > 0 ? reach / scaleY : reach);
    });
  };

  const apply = (progress: number) => {
    const point = pointAt(samples, progress);
    if (point) {
      lock.style.transform = `translate(${point.x * scaleX}px, ${point.y * scaleY}px)`;
    }
    stops.forEach((stop, index) => {
      stop.style.setProperty('--reveal', String(stopReveal(progress, thresholds[index] ?? 1)));
    });
  };

  const update = () => {
    const rect = section.getBoundingClientRect();
    apply(timelineProgress(rect.top, rect.height, window.innerHeight));
  };

  measure();

  if (prefersReducedMotion()) {
    // Nothing is scrubbed: the heart is parked at the end of its line and every
    // stop shown, so the programme reads as already played out.
    apply(1);
    return;
  }

  window.addEventListener('resize', () => {
    measure();
    update();
  }, { passive: true });

  onScrollFrame(update);
}
