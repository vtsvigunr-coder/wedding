# Preloader + Header + Hero Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the mobile-only intro flow: a click-to-start video preloader with looping background music, a persistent header that hides/shows on scroll, and the hero ("Zohan & Rose") section it reveals.

**Architecture:** Vite + vanilla TypeScript + plain CSS, single `index.html`. Branching/decision logic (header show/hide, preloader phase transitions, sound-icon state) is extracted into small pure functions covered by Vitest unit tests; DOM wiring around them is thin and verified by hand in the browser (jsdom can't play video/audio, so that part isn't unit-testable — it's checked visually per task).

**Tech Stack:** Vite 5, TypeScript, Vitest (unit tests, jsdom environment), plain CSS (no framework/Tailwind). Google Fonts CDN for Montserrat + Cormorant.

## Global Constraints

- Mobile-only layout: content column capped at `max-width: 480px`, centered; no separate desktop layout.
- No UI framework, no Tailwind, no CSS-in-JS — plain CSS files per component.
- Preloader video (`preloader.mp4`) always plays muted; only the separate music track (`wedding-music.mp3`) has audio, gated behind the Click button (user gesture).
- Preloader shows on every page load — no localStorage skip.
- Chevron_Up_Duo hint icon animates continuously (gentle bob) until clicked.
- Header is one persistent DOM node shared across preloader and hero.
- Static/binary assets (video, audio, fonts, images, icons) live in `public/` and are referenced by absolute path (`/...`), not imported through JS/CSS bundling.
- Colors: background `#f6f4f2`, accent `#7e6f5d` (Click button), mustard `#817355` (hero text).

---

## File Structure

```
index.html
package.json
tsconfig.json
vite.config.ts
vitest.config.ts
public/
  preloader.mp4
  music/wedding-music.mp3
  icons/Sound.svg
  icons/Chevron_Up_Duo.svg
  icons/Arrows.svg
  icons/click-ring.svg
  hero/background-texture.png
  hero/scroll-artwork.png
  fonts/GoodVibesPro.ttf
  fonts/LTRemark-Regular.otf
  fonts/LTRemark-Bold.otf
  fonts/LTRemark-Italic.otf
  fonts/LTRemark-BoldItalic.otf
  fonts/LTRemark-Black.otf
  fonts/LTRemark-BlackItalic.otf
src/
  main.ts
  style.css
  header.ts
  header.css
  header.test.ts
  preloader.ts
  preloader.css
  preloader.test.ts
  audio.ts
  audio.test.ts
  hero.css
```

- `header.ts` — exports the pure `nextHeaderVisible()` decision function plus `initHeader()` DOM wiring.
- `preloader.ts` — exports the pure `nextPreloaderPhase()` state machine plus `initPreloader()` DOM wiring (video/scroll-lock/transition).
- `audio.ts` — exports the pure `getSoundIconClass()` helper plus `initSoundToggle()` DOM wiring (music play/pause).
- `main.ts` — calls the three `init*()` functions on `DOMContentLoaded`.

---

### Task 1: Project scaffold, assets, base styles

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/style.css`, `src/main.ts`
- Create (copy from `content/`, `fonts/`, `music/`): all files listed under `public/` above

**Interfaces:**
- Produces: CSS custom properties `--color-background: #f6f4f2`, `--color-accent: #7e6f5d`, `--color-mustard: #817355`, `--font-remark`, `--font-goodvibes`, `--font-montserrat`, `--font-cormorant` (all defined in `src/style.css`, consumed by later tasks' CSS files).

- [ ] **Step 1: Scaffold the Vite vanilla-TS project**

```bash
cd "/Users/valeriytsvigun/wedding invitation"
npm create vite@latest . -- --template vanilla-ts
```

When prompted about the non-empty directory, choose to continue (the existing `content/`, `fonts/`, `music/`, `docs/` folders are unrelated to the template files it writes). After scaffolding, delete the template's placeholder app files we don't want:

```bash
rm -f src/counter.ts src/typescript.svg public/vite.svg
```

- [ ] **Step 2: Install dependencies (add Vitest)**

```bash
npm install
npm install -D vitest jsdom
```

- [ ] **Step 3: Copy binary assets into `public/`**

```bash
mkdir -p public/music public/icons public/hero public/fonts
cp content/preloader.mp4 public/preloader.mp4
cp music/wedding-music.mp3 public/music/wedding-music.mp3
cp content/icon/Sound.svg public/icons/Sound.svg
cp content/icon/Chevron_Up_Duo.svg public/icons/Chevron_Up_Duo.svg
cp content/icon/Arrows.svg public/icons/Arrows.svg
cp content/click-ring.svg public/icons/click-ring.svg
cp content/hero/background-texture.png public/hero/background-texture.png
cp content/hero/scroll-artwork.png public/hero/scroll-artwork.png
cp "fonts/Good Vibes Pro.ttf" public/fonts/GoodVibesPro.ttf
cp "fonts/LT_remark 2/LTRemark-Regular.otf" public/fonts/LTRemark-Regular.otf
cp "fonts/LT_remark 2/LTRemark-Bold.otf" public/fonts/LTRemark-Bold.otf
cp "fonts/LT_remark 2/LTRemark-Italic.otf" public/fonts/LTRemark-Italic.otf
cp "fonts/LT_remark 2/LTRemark-BoldItalic.otf" public/fonts/LTRemark-BoldItalic.otf
cp "fonts/LT_remark 2/LTRemark-Black.otf" public/fonts/LTRemark-Black.otf
cp "fonts/LT_remark 2/LTRemark-BlackItalic.otf" public/fonts/LTRemark-BlackItalic.otf
```

- [ ] **Step 4: Write `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Add test script to `package.json`**

Open `package.json` and add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 6: Write `index.html`**

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
    <title>Zohan &amp; Rose — Invitation</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant:wght@300&family=Montserrat:wght@400&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <header class="site-header" id="site-header">
      <p class="site-header__title">Invitation</p>
      <button class="site-header__sound" id="sound-toggle" type="button" aria-label="Toggle music" aria-pressed="true">
        <img src="/icons/Sound.svg" alt="" />
      </button>
    </header>

    <section class="preloader" id="preloader">
      <video class="preloader__video" id="preloader-video" src="/preloader.mp4" muted playsinline preload="auto"></video>
      <div class="preloader__hint" id="preloader-hint">
        <img class="preloader__chevron" src="/icons/Chevron_Up_Duo.svg" alt="" />
        <button class="preloader__click" id="preloader-click" type="button">
          <span>Сlick</span>
          <img class="preloader__click-ring" src="/icons/click-ring.svg" alt="" />
        </button>
      </div>
    </section>

    <section class="hero" id="hero">
      <img class="hero__bg" src="/hero/background-texture.png" alt="" />
      <img class="hero__artwork" src="/hero/scroll-artwork.png" alt="" />
      <div class="hero__text">
        <p class="hero__eyebrow">Wedding Day</p>
        <p class="hero__names">
          Zohan <span class="hero__amp">&amp;</span> Rose
        </p>
        <p class="hero__date">27.09.26</p>
      </div>
      <div class="hero__scroll">
        <p>Scroll down</p>
        <img src="/icons/Arrows.svg" alt="" />
      </div>
    </section>

    <audio id="bg-music" src="/music/wedding-music.mp3" loop preload="auto"></audio>

    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: Write `src/style.css`**

```css
@font-face {
  font-family: 'LT Remark';
  src: url('/fonts/LTRemark-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'LT Remark';
  src: url('/fonts/LTRemark-Bold.otf') format('opentype');
  font-weight: 700;
  font-style: normal;
}
@font-face {
  font-family: 'LT Remark';
  src: url('/fonts/LTRemark-Italic.otf') format('opentype');
  font-weight: 400;
  font-style: italic;
}
@font-face {
  font-family: 'LT Remark';
  src: url('/fonts/LTRemark-BoldItalic.otf') format('opentype');
  font-weight: 700;
  font-style: italic;
}
@font-face {
  font-family: 'LT Remark';
  src: url('/fonts/LTRemark-Black.otf') format('opentype');
  font-weight: 900;
  font-style: normal;
}
@font-face {
  font-family: 'LT Remark';
  src: url('/fonts/LTRemark-BlackItalic.otf') format('opentype');
  font-weight: 900;
  font-style: italic;
}
@font-face {
  font-family: 'Good Vibes Pro';
  src: url('/fonts/GoodVibesPro.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
}

:root {
  --color-background: #f6f4f2;
  --color-accent: #7e6f5d;
  --color-mustard: #817355;
  --font-remark: 'LT Remark', serif;
  --font-goodvibes: 'Good Vibes Pro', cursive;
  --font-montserrat: 'Montserrat', sans-serif;
  --font-cormorant: 'Cormorant', serif;
  --content-max-width: 480px;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: var(--color-background);
  font-family: var(--font-remark);
  color: #000;
  overflow-x: hidden;
}

body {
  max-width: var(--content-max-width);
  margin-inline: auto;
  position: relative;
}

body.scroll-locked {
  overflow: hidden;
  height: 100vh;
}

img {
  max-width: 100%;
  display: block;
}

button {
  font-family: inherit;
  border: none;
  cursor: pointer;
  background: none;
}
```

- [ ] **Step 8: Write a placeholder `src/main.ts` and verify the dev server**

```typescript
import './style.css';

console.log('app booted');
```

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL (e.g. `http://localhost:5173`). Open it — expected: a blank page with background color `#f6f4f2` and no console errors. Stop the server (Ctrl+C) once confirmed.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Scaffold Vite project, copy assets, add base styles

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Header — scroll show/hide logic + styles

**Files:**
- Create: `src/header.ts`, `src/header.test.ts`, `src/header.css`
- Modify: `index.html:9-14` add `<link rel="stylesheet" href="/src/header.css" />` — actually import from `main.ts` instead (see Step 4).

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `nextHeaderVisible(prevScrollY: number, currScrollY: number, wasVisible: boolean): boolean` and `initHeader(): void`, both exported from `src/header.ts`. `initHeader()` is called by `main.ts` in Task 6.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/header.test.ts
import { describe, expect, it } from 'vitest';
import { nextHeaderVisible } from './header';

describe('nextHeaderVisible', () => {
  it('stays visible at the very top of the page', () => {
    expect(nextHeaderVisible(0, 0, true)).toBe(true);
  });

  it('hides once scrolling down past the top', () => {
    expect(nextHeaderVisible(0, 40, true)).toBe(false);
  });

  it('stays hidden while continuing to scroll down', () => {
    expect(nextHeaderVisible(200, 240, false)).toBe(false);
  });

  it('shows again when scrolling up', () => {
    expect(nextHeaderVisible(240, 200, false)).toBe(true);
  });

  it('shows when scrolled back to the top even if moving up slowly', () => {
    expect(nextHeaderVisible(10, 0, false)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm run test
```

Expected: FAIL — `header.ts` does not exist / `nextHeaderVisible` is not exported.

- [ ] **Step 3: Implement `src/header.ts`**

```typescript
export function nextHeaderVisible(prevScrollY: number, currScrollY: number, wasVisible: boolean): boolean {
  if (currScrollY <= 0) return true;
  if (currScrollY > prevScrollY) return false; // scrolling down
  if (currScrollY < prevScrollY) return true; // scrolling up
  return wasVisible;
}

export function initHeader(): void {
  const header = document.getElementById('site-header');
  if (!header) return;

  let prevScrollY = window.scrollY;
  let visible = true;

  window.addEventListener(
    'scroll',
    () => {
      const currScrollY = window.scrollY;
      visible = nextHeaderVisible(prevScrollY, currScrollY, visible);
      header.classList.toggle('site-header--hidden', !visible);
      prevScrollY = currScrollY;
    },
    { passive: true },
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm run test
```

Expected: PASS — all 5 `nextHeaderVisible` cases green.

- [ ] **Step 5: Write `src/header.css`**

```css
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  max-width: var(--content-max-width);
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.28);
  transform: translateY(0);
  transition: transform 0.3s ease;
}

.site-header--hidden {
  transform: translateY(-100%);
}

.site-header__title {
  margin: 0;
  font-size: 18px;
  font-family: var(--font-remark);
  color: #000;
}

.site-header__sound {
  width: 24px;
  height: 24px;
}

.site-header__sound img {
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 6: Wire the header into the app and import its CSS**

Edit `src/main.ts`:

```typescript
import './style.css';
import './header.css';
import { initHeader } from './header';

initHeader();
```

- [ ] **Step 7: Manual check in the browser**

```bash
npm run dev
```

Temporarily add `<div style="height: 2000px"></div>` after `</section>` (hero) in `index.html` so the page is scrollable (remove this in Task 5/6 once the hero section provides real height). Open the dev URL, scroll down — expected: header slides up out of view. Scroll up — expected: header slides back in. Remove the temporary tall div before committing.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add header with scroll-direction show/hide

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Preloader — state machine + hint animation + styles

**Files:**
- Create: `src/preloader.ts`, `src/preloader.test.ts`, `src/preloader.css`

**Interfaces:**
- Consumes: nothing.
- Produces: `type PreloaderPhase = 'idle' | 'playing' | 'done'`, `nextPreloaderPhase(phase: PreloaderPhase, event: 'click' | 'video-ended'): PreloaderPhase`, and `initPreloader(onDone: () => void): void`, all exported from `src/preloader.ts`. `initPreloader` is called by `main.ts` in Task 6, passing a callback that reveals the hero and unlocks scroll (defined in Task 5/6).

- [ ] **Step 1: Write the failing tests**

```typescript
// src/preloader.test.ts
import { describe, expect, it } from 'vitest';
import { nextPreloaderPhase } from './preloader';

describe('nextPreloaderPhase', () => {
  it('moves from idle to playing on click', () => {
    expect(nextPreloaderPhase('idle', 'click')).toBe('playing');
  });

  it('ignores a second click while already playing', () => {
    expect(nextPreloaderPhase('playing', 'click')).toBe('playing');
  });

  it('moves from playing to done when the video ends', () => {
    expect(nextPreloaderPhase('playing', 'video-ended')).toBe('done');
  });

  it('ignores video-ended if not currently playing', () => {
    expect(nextPreloaderPhase('idle', 'video-ended')).toBe('idle');
  });

  it('stays done once finished', () => {
    expect(nextPreloaderPhase('done', 'click')).toBe('done');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm run test
```

Expected: FAIL — `preloader.ts` does not exist.

- [ ] **Step 3: Implement the state machine and DOM wiring in `src/preloader.ts`**

```typescript
export type PreloaderPhase = 'idle' | 'playing' | 'done';

export function nextPreloaderPhase(phase: PreloaderPhase, event: 'click' | 'video-ended'): PreloaderPhase {
  if (phase === 'idle' && event === 'click') return 'playing';
  if (phase === 'playing' && event === 'video-ended') return 'done';
  return phase;
}

export function initPreloader(onDone: () => void): void {
  const preloader = document.getElementById('preloader');
  const hint = document.getElementById('preloader-hint');
  const clickButton = document.getElementById('preloader-click');
  const video = document.getElementById('preloader-video') as HTMLVideoElement | null;
  const music = document.getElementById('bg-music') as HTMLAudioElement | null;
  if (!preloader || !hint || !clickButton || !video) return;

  let phase: PreloaderPhase = 'idle';
  document.body.classList.add('scroll-locked');

  clickButton.addEventListener('click', () => {
    phase = nextPreloaderPhase(phase, 'click');
    if (phase !== 'playing') return;

    hint.classList.add('preloader__hint--gone');
    video.play();
    music?.play();
  });

  video.addEventListener('ended', () => {
    phase = nextPreloaderPhase(phase, 'video-ended');
    if (phase !== 'done') return;

    preloader.classList.add('preloader--done');
    document.body.classList.remove('scroll-locked');
    onDone();
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm run test
```

Expected: PASS — all 5 `nextPreloaderPhase` cases green.

- [ ] **Step 5: Write `src/preloader.css`**

```css
.preloader {
  position: fixed;
  inset: 0;
  z-index: 10;
  max-width: var(--content-max-width);
  margin-inline: auto;
  overflow: hidden;
  background: var(--color-background);
  transition: opacity 0.6s ease;
}

.preloader--done {
  opacity: 0;
  pointer-events: none;
}

.preloader__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preloader__hint {
  position: absolute;
  left: 50%;
  top: calc(50% + 30px);
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: opacity 0.4s ease;
}

.preloader__hint--gone {
  opacity: 0;
  pointer-events: none;
}

.preloader__chevron {
  width: 32px;
  height: 32px;
  animation: chevron-bob 1.6s ease-in-out infinite;
}

@keyframes chevron-bob {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.preloader__click {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preloader__click span {
  color: #fff;
  font-size: 16px;
  z-index: 1;
}

.preloader__click-ring {
  position: absolute;
  inset: 2px;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
}
```

- [ ] **Step 6: Manual check in the browser**

```bash
npm run dev
```

Open the dev URL — expected: full-screen preloader, chevron bobbing above the "Click" button. Click it — expected: hint fades out, video starts playing (visually, muted), background music becomes audible. Let the video run to completion (~6s) — expected: preloader fades out (page still blank underneath until Task 5 adds the hero markup content, but scroll should now be unlocked — check by trying to scroll, it should no longer be locked).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add preloader state machine, click-to-play video, and hint animation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Sound toggle — icon state + music control

**Files:**
- Create: `src/audio.ts`, `src/audio.test.ts`
- Modify: `src/header.css` (append wave animation rule)

**Interfaces:**
- Consumes: `#bg-music` `<audio>` element and `#sound-toggle` button from `index.html` (Task 1).
- Produces: `getSoundIconClass(isPlaying: boolean): string` and `initSoundToggle(): void`, exported from `src/audio.ts`. `initSoundToggle()` is called by `main.ts` in Task 6.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/audio.test.ts
import { describe, expect, it } from 'vitest';
import { getSoundIconClass } from './audio';

describe('getSoundIconClass', () => {
  it('returns the playing class when music is playing', () => {
    expect(getSoundIconClass(true)).toBe('site-header__sound--playing');
  });

  it('returns an empty string when music is paused', () => {
    expect(getSoundIconClass(false)).toBe('');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm run test
```

Expected: FAIL — `audio.ts` does not exist.

- [ ] **Step 3: Implement `src/audio.ts`**

```typescript
export function getSoundIconClass(isPlaying: boolean): string {
  return isPlaying ? 'site-header__sound--playing' : '';
}

export function initSoundToggle(): void {
  const toggle = document.getElementById('sound-toggle');
  const music = document.getElementById('bg-music') as HTMLAudioElement | null;
  if (!toggle || !music) return;

  const sync = () => {
    const isPlaying = !music.paused;
    toggle.classList.toggle('site-header__sound--playing', isPlaying);
    toggle.setAttribute('aria-pressed', String(isPlaying));
  };

  toggle.addEventListener('click', () => {
    if (music.paused) {
      music.play();
    } else {
      music.pause();
    }
  });

  music.addEventListener('play', sync);
  music.addEventListener('pause', sync);
  sync();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm run test
```

Expected: PASS — both `getSoundIconClass` cases green.

- [ ] **Step 5: Append the wave animation rule to `src/header.css`**

```css
.site-header__sound--playing path {
  animation: sound-wave 1.2s ease-in-out infinite;
  transform-origin: center;
}

@keyframes sound-wave {
  0%, 100% {
    opacity: 0.6;
    transform: scaleY(0.85);
  }
  50% {
    opacity: 1;
    transform: scaleY(1.15);
  }
}
```

Note: `content/icon/Sound.svg`'s wave is a `<path>` directly inside the inline `<img>` reference — since it's loaded via `<img src="...svg">`, its internal paths aren't stylable from the parent page's CSS (images loaded via `<img>` are opaque documents). To make the wave path animatable, inline the SVG markup directly into `index.html` instead of using `<img>`.

- [ ] **Step 6: Inline the Sound SVG markup in `index.html`**

Replace the sound button markup from Task 1's Step 6 (`<button class="site-header__sound" ...><img src="/icons/Sound.svg" alt="" /></button>`) with:

```html
<button class="site-header__sound" id="sound-toggle" type="button" aria-label="Toggle music" aria-pressed="true">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.25" y="0.25" width="23.5" height="23.5" rx="11.75" stroke="black" stroke-width="0.5"/>
    <path d="M7 13L8.4405 11.2394C9.41074 10.0535 11.2975 10.3437 11.8665 11.7663C12.4031 13.1078 14.1364 13.4635 15.158 12.4419L17 10.6" stroke="black" stroke-width="0.5" stroke-linecap="round"/>
  </svg>
</button>
```

(This is `content/icon/Sound.svg`'s markup, inlined — verify it still matches that file before pasting, in case the asset changes.)

- [ ] **Step 7: Wire the sound toggle into `main.ts`**

Edit `src/main.ts`:

```typescript
import './style.css';
import './header.css';
import { initHeader } from './header';
import { initSoundToggle } from './audio';

initHeader();
initSoundToggle();
```

- [ ] **Step 8: Manual check in the browser**

```bash
npm run dev
```

Click through the preloader so music starts. Click the sound icon in the header — expected: music pauses, the wave path stops animating (frozen mid-shape is fine). Click again — expected: music resumes, wave path animates again.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add sound toggle with animated wave icon

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Hero section styles and layout

**Files:**
- Modify: `index.html:hero section` (already scaffolded in Task 1, no markup changes needed unless noted)
- Create: `src/hero.css`

**Interfaces:**
- Consumes: `.hero`, `.hero__bg`, `.hero__artwork`, `.hero__text`, `.hero__eyebrow`, `.hero__names`, `.hero__amp`, `.hero__date`, `.hero__scroll` markup from `index.html` (Task 1).
- Produces: nothing consumed by later tasks (this is the last visual task in this phase).

- [ ] **Step 1: Write `src/hero.css`**

```css
.hero {
  position: relative;
  min-height: 100vh;
  max-width: var(--content-max-width);
  margin-inline: auto;
  overflow: hidden;
  padding-top: 88px;
}

.hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.32;
  pointer-events: none;
}

.hero__artwork {
  position: relative;
  width: 78%;
  margin: 40px auto 0;
  display: block;
}

.hero__text {
  position: relative;
  text-align: center;
  color: var(--color-mustard);
  margin-top: -280px;
}

.hero__eyebrow {
  font-family: var(--font-montserrat);
  font-size: 16px;
  letter-spacing: 0.64px;
  text-transform: uppercase;
  margin: 0 0 24px;
}

.hero__names {
  font-family: var(--font-goodvibes);
  font-size: 44px;
  margin: 0;
  line-height: 1.1;
}

.hero__amp {
  font-family: var(--font-cormorant);
  font-weight: 300;
  font-size: 26px;
  text-transform: lowercase;
  margin-inline: 4px;
}

.hero__date {
  font-family: var(--font-remark);
  font-size: 18px;
  margin-top: 24px;
}

.hero__scroll {
  position: relative;
  margin: 48px auto 0;
  width: fit-content;
  min-width: 200px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  text-align: center;
  backdrop-filter: blur(8.5px);
  background: rgba(255, 255, 255, 0.1);
  -webkit-mask-image: linear-gradient(to top, black 60%, transparent 100%);
  mask-image: linear-gradient(to top, black 60%, transparent 100%);
}

.hero__scroll p {
  margin: 0;
  font-size: 14px;
  line-height: 18px;
}

.hero__scroll img {
  width: 14px;
}
```

- [ ] **Step 2: Import the hero CSS**

Edit `src/main.ts`:

```typescript
import './style.css';
import './header.css';
import './hero.css';
import { initHeader } from './header';
import { initSoundToggle } from './audio';

initHeader();
initSoundToggle();
```

- [ ] **Step 3: Remove the temporary scroll-height div from Task 2 (if still present)**

Confirm `index.html` has no leftover `<div style="height: 2000px"></div>` — the hero section now provides real page height.

- [ ] **Step 4: Manual check in the browser**

```bash
npm run dev
```

Resize the preview to a mobile width (375px). Compare against the Figma hero frame (node `136:114`) — expected: background texture faint behind the scroll artwork, "WEDDING DAY" / "Zohan & Rose" / "27.09.26" centered over the artwork, "Scroll down" pill at the bottom with the arrows icon and a fading frosted background.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add hero section styles

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Final wiring and full-flow verification

**Files:**
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `initHeader()`, `initSoundToggle()` (already wired), `initPreloader(onDone: () => void)` from Task 3.
- Produces: nothing further — this is the integration point for this phase.

- [ ] **Step 1: Wire `initPreloader` into `main.ts`**

```typescript
import './style.css';
import './header.css';
import './preloader.css';
import './hero.css';
import { initHeader } from './header';
import { initSoundToggle } from './audio';
import { initPreloader } from './preloader';

initHeader();
initSoundToggle();
initPreloader(() => {
  // Hero is already in the DOM (Task 1/5); nothing further needed here
  // beyond what initPreloader itself does (unlock scroll, fade preloader).
});
```

- [ ] **Step 2: Run the full unit test suite**

```bash
npm run test
```

Expected: PASS — all tests from Tasks 2, 3, 4 (11 total: 5 header + 5 preloader + 2 audio... verify count matches what you wrote) green, zero failures.

- [ ] **Step 3: Run a production build**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors, `dist/` is created.

- [ ] **Step 4: Full manual flow check in the browser**

```bash
npm run dev
```

Resize preview to mobile width. Walk the entire flow:
1. Page loads — expected: preloader visible, header visible on top, chevron bobbing, body doesn't scroll.
2. Click "Click" — expected: hint disappears, video plays (muted), music becomes audible, sound icon wave animates.
3. Wait for video to finish (~6s) — expected: preloader fades out, hero section visible underneath, page becomes scrollable.
4. Scroll down — expected: header slides up and out of view.
5. Scroll up — expected: header slides back down into view.
6. Click the sound icon — expected: music pauses, wave animation stops; click again — expected: music resumes, wave animates again.
7. Reload the page — expected: preloader shows again from the start (no skip).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Wire preloader into main entry point, complete phase 1 integration

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
