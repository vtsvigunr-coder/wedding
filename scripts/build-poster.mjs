// Pulls the first frame of public/preloader.mp4 into the poster the <video>
// falls back to. Run with `npm run build:poster` after replacing the video; the
// poster it writes is committed, so a normal build never needs ffmpeg.
//
// The first screen paints nothing of its own — the flowers and the closed
// scroll a visitor sees before tapping are the video's opening frame. Phones
// are free to ignore `preload`, and iOS Safari does, treating `auto` as `none`;
// without a poster those visitors get a blank page until playback starts.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'public/preloader.mp4');
const OUT = path.join(root, 'public/preloader-poster.webp');

// The poster is only ever shown for the moment before playback, so it can be
// leaner than the video's own first frame would be at full quality.
const WEBP_QUALITY = 82;

const work = mkdtempSync(path.join(tmpdir(), 'poster-'));

try {
  const frame = path.join(work, 'frame.png');
  execFileSync(ffmpegPath, ['-y', '-i', SOURCE, '-frames:v', '1', '-f', 'image2', frame], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  const { width, height, size } = await sharp(frame).webp({ quality: WEBP_QUALITY }).toFile(OUT);
  console.log(`${path.relative(root, OUT)} — ${width}x${height}, ${Math.round(size / 1024)} KB`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
