// Turns content/letter.mp4 into the transparent WebP sequence the letter scrub
// draws from. Run with `npm run build:letter` after replacing the source video;
// the frames it writes are committed, so a normal build never needs ffmpeg.
//
// The source is a 4K HEVC clip with the actual (vertical) footage pillarboxed
// inside it, shot against a light grey backdrop that runs as a smooth gradient
// from ~236 at the top to ~250 at the bottom. A luma key is not an option: the
// invitation card inside the envelope is the same brightness as the backdrop
// behind it, so a brightness threshold punches a hole straight through it.
// Instead we model the backdrop and key on the difference from that model, then
// flood fill from the border so anything the fill cannot reach — the card — stays
// opaque no matter how closely it matches.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'content/letter.mp4');
const OUT_DIR = path.join(root, 'public/letter');

const FRAME_COUNT = 60;
// Decode height. Well below the 2160 source: at full resolution the sensor and
// HEVC noise on the backdrop swamps the few levels that separate it from the
// envelope's soft shadow, and the key picks up the frame edges.
const DECODE_HEIGHT = 1620;
const OUT_WIDTH = 640; // ~1.5x the 422px envelope in the 375px design
// Quality barely moves the file size here — the alpha channel dominates — so
// this is set for looks and the size is bought back with OUT_WIDTH instead.
const WEBP_QUALITY = 72;

// Backdrop model / keying constants, all in 0-255 units.
const PILLARBOX_THRESHOLD = 12; // column mean above this = real footage, not black bar
const MARGIN_COLUMNS = 12; // sampled from each side to fit the backdrop gradient
const BLUR_RADIUS = 2; // box blur applied to the difference map before thresholding
const SOLID_DIFF = 8; // difference above this is confidently foreground
const ALPHA_FLOOR = 4; // difference below this is confidently backdrop
const ALPHA_RAMP = 10; // width of the soft edge between the two

/** Reads a PNG into { width, height, data } with 3 bytes per pixel. */
async function readRgb(file) {
  const image = sharp(file).removeAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}

/** Finds the horizontal bounds of the real footage inside the pillarboxed frame. */
function contentColumns({ width, height, data }) {
  let first = -1;
  let last = -1;
  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let y = 0; y < height; y += 1) {
      const i = (y * width + x) * 3;
      sum += data[i] + data[i + 1] + data[i + 2];
    }
    if (sum / (height * 3) > PILLARBOX_THRESHOLD) {
      if (first === -1) first = x;
      last = x;
    }
  }
  // Nudge inwards: the pillarbox edges carry compression ringing that would
  // otherwise poison the backdrop fit, which samples exactly these columns.
  return { x0: first + 2, x1: last - 1 };
}

/**
 * Fits the backdrop for one row by interpolating between its left and right
 * margins. The margins are always backdrop — the envelope never reaches them —
 * and the gradient is smooth enough that a straight line across is accurate to
 * a level or two.
 */
function backdropPlate({ width, height, data }, x0, x1) {
  const w = x1 - x0;
  const plate = new Float32Array(w * height * 3);
  for (let y = 0; y < height; y += 1) {
    const left = [0, 0, 0];
    const right = [0, 0, 0];
    for (let m = 0; m < MARGIN_COLUMNS; m += 1) {
      const li = (y * width + x0 + m) * 3;
      const ri = (y * width + x1 - 1 - m) * 3;
      for (let c = 0; c < 3; c += 1) {
        left[c] += data[li + c];
        right[c] += data[ri + c];
      }
    }
    for (let c = 0; c < 3; c += 1) {
      left[c] /= MARGIN_COLUMNS;
      right[c] /= MARGIN_COLUMNS;
    }
    for (let x = 0; x < w; x += 1) {
      const t = w > 1 ? x / (w - 1) : 0;
      const o = (y * w + x) * 3;
      for (let c = 0; c < 3; c += 1) {
        plate[o + c] = left[c] * (1 - t) + right[c] * t;
      }
    }
  }
  return plate;
}

/**
 * Separable box blur over the difference map. Keying on the blurred difference
 * rather than the raw one is what keeps grain in the backdrop from reading as
 * foreground; the colour channels stay untouched and sharp.
 */
function blurDiff(diff, w, h, radius) {
  const span = radius * 2 + 1;
  const pass = new Float32Array(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let sum = 0;
      for (let k = -radius; k <= radius; k += 1) {
        sum += diff[y * w + Math.min(w - 1, Math.max(0, x + k))];
      }
      pass[y * w + x] = sum / span;
    }
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let sum = 0;
      for (let k = -radius; k <= radius; k += 1) {
        sum += pass[Math.min(h - 1, Math.max(0, y + k)) * w + x];
      }
      out[y * w + x] = sum / span;
    }
  }
  return out;
}

/**
 * Keeps only the largest connected blob of foreground, then dilates it so the
 * soft alpha ramp around the envelope survives. The backdrop has a faint seam
 * near the top of the frame that keys as a handful of stray specks; the
 * envelope is always one contiguous shape, so discarding everything else is
 * both safe and complete.
 */
function largestBlobMask(isForeground, w, h, dilation) {
  const label = new Int32Array(w * h).fill(-1);
  const queue = new Int32Array(w * h);
  let best = -1;
  let bestSize = 0;
  let next = 0;

  for (let seed = 0; seed < isForeground.length; seed += 1) {
    if (!isForeground[seed] || label[seed] !== -1) continue;
    const id = next;
    next += 1;
    let head = 0;
    let tail = 0;
    label[seed] = id;
    queue[tail] = seed;
    tail += 1;
    while (head < tail) {
      const index = queue[head];
      head += 1;
      const x = index % w;
      const y = (index - x) / w;
      const visit = (n) => {
        if (isForeground[n] && label[n] === -1) {
          label[n] = id;
          queue[tail] = n;
          tail += 1;
        }
      };
      if (x > 0) visit(index - 1);
      if (x < w - 1) visit(index + 1);
      if (y > 0) visit(index - w);
      if (y < h - 1) visit(index + w);
    }
    if (tail > bestSize) {
      bestSize = tail;
      best = id;
    }
  }

  const mask = new Uint8Array(w * h);
  for (let i = 0; i < label.length; i += 1) {
    if (label[i] === best) mask[i] = 1;
  }
  return dilate(mask, w, h, dilation);
}

/** Square dilation, run as two separable passes. */
function dilate(mask, w, h, radius) {
  if (radius <= 0) return mask;
  const pass = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let on = 0;
      for (let k = -radius; k <= radius && !on; k += 1) {
        on = mask[y * w + Math.min(w - 1, Math.max(0, x + k))];
      }
      pass[y * w + x] = on;
    }
  }
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let on = 0;
      for (let k = -radius; k <= radius && !on; k += 1) {
        on = pass[Math.min(h - 1, Math.max(0, y + k)) * w + x];
      }
      out[y * w + x] = on;
    }
  }
  return out;
}

/**
 * Marks every pixel reachable from the frame border without crossing the
 * foreground mask. Pixels left unmarked are enclosed by the envelope — the
 * invitation card, the inside of the flap — and must stay opaque.
 */
function reachableFromBorder(isForeground, w, h) {
  const outside = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const push = (index) => {
    if (!outside[index] && !isForeground[index]) {
      outside[index] = 1;
      queue[tail] = index;
      tail += 1;
    }
  };
  for (let x = 0; x < w; x += 1) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y += 1) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % w;
    const y = (index - x) / w;
    if (x > 0) push(index - 1);
    if (x < w - 1) push(index + 1);
    if (y > 0) push(index - w);
    if (y < h - 1) push(index + w);
  }
  return outside;
}

/** Keys one extracted PNG, returning RGBA pixels at the source resolution. */
async function keyFrame(file) {
  const frame = await readRgb(file);
  const { x0, x1 } = contentColumns(frame);
  const w = x1 - x0;
  const h = frame.height;
  const plate = backdropPlate(frame, x0, x1);

  const raw = new Float32Array(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const src = (y * frame.width + x0 + x) * 3;
      const dst = y * w + x;
      let worst = 0;
      for (let c = 0; c < 3; c += 1) {
        const d = Math.abs(frame.data[src + c] - plate[dst * 3 + c]);
        if (d > worst) worst = d;
      }
      raw[dst] = worst;
    }
  }

  const diff = blurDiff(raw, w, h, BLUR_RADIUS);
  const isForeground = new Uint8Array(w * h);
  for (let i = 0; i < diff.length; i += 1) {
    isForeground[i] = diff[i] > SOLID_DIFF ? 1 : 0;
  }

  const outside = reachableFromBorder(isForeground, w, h);
  const keep = largestBlobMask(isForeground, w, h, BLUR_RADIUS * 2 + 2);

  const rgba = Buffer.allocUnsafe(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const dst = y * w + x;
      const src = (y * frame.width + x0 + x) * 3;
      const o = dst * 4;
      rgba[o] = frame.data[src];
      rgba[o + 1] = frame.data[src + 1];
      rgba[o + 2] = frame.data[src + 2];
      const soft = Math.min(1, Math.max(0, (diff[dst] - ALPHA_FLOOR) / ALPHA_RAMP));
      const alpha = outside[dst] ? soft : 1;
      rgba[o + 3] = keep[dst] ? Math.round(alpha * 255) : 0;
    }
  }
  return { width: w, height: h, data: rgba };
}

/** Union of every frame's opaque bounds, so the envelope does not jitter. */
function unionBounds(frames) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { width, height, data } of frames) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (data[(y * width + x) * 4 + 3] > 24) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function main() {
  const work = mkdtempSync(path.join(tmpdir(), 'letter-frames-'));
  try {
    // `select` picks FRAME_COUNT evenly spaced source frames; -vsync 0 keeps
    // ffmpeg from padding the output back up to the original frame rate.
    const stride = `not(mod(n\\,${Math.max(1, Math.round(121 / FRAME_COUNT))}))`;
    execFileSync(
      ffmpegPath,
      [
        '-y', '-v', 'error',
        '-i', SOURCE,
        '-vf', `select='${stride}',scale=-2:${DECODE_HEIGHT}`,
        '-vsync', '0',
        '-frames:v', String(FRAME_COUNT),
        path.join(work, 'src-%03d.png'),
      ],
      { stdio: 'inherit' },
    );

    const files = readdirSync(work).filter((f) => f.endsWith('.png')).sort();
    if (files.length < FRAME_COUNT) {
      throw new Error(`expected ${FRAME_COUNT} frames from ffmpeg, got ${files.length}`);
    }
    process.stdout.write(`keying ${files.length} frames\n`);

    const keyed = [];
    for (const [index, file] of files.entries()) {
      keyed.push(await keyFrame(path.join(work, file)));
      process.stdout.write(`\r  ${index + 1}/${files.length}`);
    }
    process.stdout.write('\n');

    const box = unionBounds(keyed);
    process.stdout.write(`crop ${box.width}x${box.height} at ${box.left},${box.top}\n`);

    rmSync(OUT_DIR, { recursive: true, force: true });
    mkdirSync(OUT_DIR, { recursive: true });

    let bytes = 0;
    for (const [index, frame] of keyed.entries()) {
      const name = `frame-${String(index).padStart(2, '0')}.webp`;
      const info = await sharp(frame.data, {
        raw: { width: frame.width, height: frame.height, channels: 4 },
      })
        .extract(box)
        .resize({ width: OUT_WIDTH })
        .webp({ quality: WEBP_QUALITY, alphaQuality: 100 })
        .toFile(path.join(OUT_DIR, name));
      bytes += info.size;
    }
    process.stdout.write(
      `wrote ${keyed.length} frames to public/letter (${Math.round(bytes / 1024)} KB total)\n`,
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

await main();
