import { clamp01, fitScale, headerHeight, onScrollFrame, prefersReducedMotion } from './scroll';

export const LETTER_FRAME_COUNT = 60;

/** The design's canvas for the greeting; it shrinks to fit shorter screens. */
export const GREETING_HEIGHT = 720;

/**
 * How far the pinned stage has been scrolled through, 0 to 1. The stage is
 * taller than the viewport; the pin sticks for exactly the surplus.
 */
export function stageProgress(top: number, height: number, viewportHeight: number): number {
  const travel = height - viewportHeight;
  if (travel <= 0) return top <= 0 ? 1 : 0;
  return clamp01(-top / travel);
}

/**
 * Maps stage progress to a frame. The envelope finishes opening at
 * `openBy` so the last stretch of the pin is free for the bouquet to ride in
 * over an already-open envelope.
 */
export function letterFrameIndex(progress: number, frameCount: number, openBy = 0.7): number {
  if (frameCount <= 0) return 0;
  const scrubbed = openBy <= 0 ? 1 : clamp01(progress / openBy);
  return Math.min(frameCount - 1, Math.round(scrubbed * (frameCount - 1)));
}

export function letterFrameSrc(index: number): string {
  return `/letter/frame-${String(index).padStart(2, '0')}.webp`;
}

function createFrame(index: number): HTMLImageElement {
  const image = new Image();
  image.decoding = 'async';
  image.src = letterFrameSrc(index);
  return image;
}

/**
 * Fetches the sequence once the preloader video is actually playing. Starting
 * earlier would put ~2MB of frames on the wire alongside the video the visitor
 * is waiting on; playback gives us six seconds of otherwise idle bandwidth.
 */
function preloadRest(frames: HTMLImageElement[]): void {
  const load = () => {
    for (let i = 1; i < LETTER_FRAME_COUNT; i += 1) frames[i] = createFrame(i);
  };
  const video = document.getElementById('preloader-video');
  if (!video) {
    load();
    return;
  }
  video.addEventListener('playing', load, { once: true });
}

export function initLetter(): void {
  const stage = document.getElementById('letter-stage');
  const canvas = document.getElementById('letter-canvas') as HTMLCanvasElement | null;
  if (!stage || !canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const frames: HTMLImageElement[] = new Array(LETTER_FRAME_COUNT);

  let drawn = -1;

  const draw = (index: number) => {
    const image = frames[index];
    // A frame that has not arrived yet leaves the previous one on screen rather
    // than blanking the envelope mid-scroll.
    if (!image?.complete || image.naturalWidth === 0) return;
    if (canvas.width !== image.naturalWidth || canvas.height !== image.naturalHeight) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    drawn = index;
  };

  const drawWhenReady = (index: number) => {
    const image = frames[index];
    if (!image) return;
    if (image.complete && image.naturalWidth > 0) {
      draw(index);
      return;
    }
    image.addEventListener('load', () => {
      // Only catch up if the scroll has not already moved on to another frame.
      if (drawn === -1) draw(index);
    }, { once: true });
  };

  if (prefersReducedMotion()) {
    // The stage is unpinned and flows at its own height, so there is nothing to
    // fit; only the open envelope is ever shown, and the rest of the sequence
    // is never fetched.
    const last = LETTER_FRAME_COUNT - 1;
    frames[last] = createFrame(last);
    drawWhenReady(last);
    return;
  }

  const greeting = document.getElementById('greeting');
  const fit = () => {
    greeting?.style.setProperty(
      '--fit',
      String(fitScale(window.innerHeight, GREETING_HEIGHT, headerHeight())),
    );
  };

  fit();
  window.addEventListener('resize', fit, { passive: true });

  // The closed envelope is fetched right away so it is on screen the moment the
  // preloader lifts; the rest follows once the preloader video is under way.
  frames[0] = createFrame(0);
  preloadRest(frames);
  drawWhenReady(0);

  onScrollFrame(() => {
    const rect = stage.getBoundingClientRect();
    const progress = stageProgress(rect.top, rect.height, window.innerHeight);
    const index = letterFrameIndex(progress, LETTER_FRAME_COUNT);
    if (index !== drawn) draw(index);
  });
}
