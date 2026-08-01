# Preloader + Header + Hero Section — Design

## Context

Wedding invitation site, mobile-only. This is phase 1: the preloader
(intro video + music gate), the persistent header, and the first
("hero") content section. RSVP (name/surname + attendance) and
subsequent sections are out of scope — a later phase.

Figma reference:
- Preloader: https://www.figma.com/design/TS7Atu8MncXA6RF3DlKGI8/Wedding-sites?node-id=136-137&m=dev
- Hero: https://www.figma.com/design/TS7Atu8MncXA6RF3DlKGI8/Wedding-sites?node-id=136-114&m=dev

Provided assets:
- `content/preloader.mp4` — 1080×1920 (9:16), ~6.06s, has an audio track (must be muted).
- `content/icon/Sound.svg` — circle + single wave squiggle, used as the mute/unmute icon.
- `content/icon/Chevron_Up_Duo.svg` — double up-chevron, hint icon above the Click button.
- `content/icon/Arrows.svg` — double down-arrow icon for the "Scroll down" indicator.
- `fonts/Good Vibes Pro.ttf`, `fonts/LT_remark 2/*.otf` — script/serif faces used for names/labels.
- `music/wedding-music.mp3` — looping background track.

Missing assets, to be sourced:
- Montserrat (Regular) and Cormorant (Light) — not present locally. **Decision: load via Google Fonts CDN** (accepted trade-off: requires network at load time).
- Hero background texture image and the mountain/lake/floral "scroll" artwork — not present locally. **Decision: download the exact PNGs from the Figma file via the MCP asset URLs and commit them under `public/hero/`.**

## Stack

Vite + vanilla TypeScript + plain CSS. No UI framework, no Tailwind.
Single mobile-only page; content column capped at a max-width (~480px)
and centered, so a desktop browser just shows it letterboxed rather
than needing a separate desktop layout.

## File layout

```
index.html
src/
  main.ts          # wires up preloader, header, hero on DOMContentLoaded
  preloader.ts      # click → play video (muted) + music, unlock on video end
  audio.ts          # music play/pause, sound-icon wave animation toggle
  header.ts         # scroll-direction show/hide
  style.css         # base/reset, fonts, layout tokens
  preloader.css
  header.css
  hero.css
public/
  preloader.mp4
  music/wedding-music.mp3
  icons/Sound.svg, Chevron_Up_Duo.svg, Arrows.svg
  fonts/... (Good Vibes Pro, LT Remark family)
  hero/... (downloaded background + scroll artwork PNGs)
```

Static/binary assets live in `public/` so Vite serves them unmodified
(no hashing/inlining needed for large media).

## Preloader

Full-viewport fixed overlay, shown on every page load (no
localStorage skip). Body scroll is locked while it's visible.

Initial state: video element present but not playing (poster/first
frame or a plain background-color placeholder), header visible on
top, centered 72px circular "Click" button (accent `#7e6f5d`
background, dashed ring decoration, "Click" label) with the
Chevron_Up_Duo icon above it. The chevron plays a continuous, gentle
translateY loop (CSS animation) as an affordance hint — this is the
only thing animating pre-click.

On click:
1. Button and chevron fade out (CSS transition).
2. `<video>` (`muted`, `playsinline`) starts playing, `object-fit:
   cover`, filling the viewport.
3. Background music (`wedding-music.mp3`) starts, `loop = true`,
   unmuted — allowed since it's triggered by a user gesture.
4. On the video's `ended` event: the preloader overlay fades out,
   revealing the hero section beneath it, and body scroll unlocks.

The header DOM node is shared/persistent across the preloader and the
hero section (not remounted) so the transition feels continuous.

## Header

Semi-transparent bar (`rgba(255,255,255,0.28)` background),
"Invitation" label (left, LT Remark), Sound icon (right,
`content/icon/Sound.svg`).

Scroll behavior: translateY(-100%) to hide on scroll-down,
translateY(0) to show on scroll-up. Listener only meaningfully acts
once the page is scrollable, i.e. after the preloader has finished
(scroll is locked during the preloader anyway, so this falls out
naturally rather than needing an explicit guard).

Sound icon: clicking toggles `music.paused`. A CSS class (e.g.
`.is-playing`) on the icon drives a subtle looping animation on the
wave path (opacity/scale pulse); removed when paused so the icon is
static. Video stays muted regardless of this toggle — it only
controls the background music.

## Hero section

Matches the Figma "intro" (hero) frame:
- Full-bleed background texture image at 32% opacity (downloaded PNG).
- Centered vertical "scroll" artwork (mountain/lake/floral card,
  downloaded PNG), ~317×624 within a 405×720 frame.
- Overlaid text: "WEDDING DAY" (Montserrat, uppercase, letter-spacing),
  "Zohan & Rose" (Good Vibes Pro script, with "&" in Cormorant Light),
  date "27.09.26" (LT Remark).
- Bottom "Scroll down" indicator: frosted pill
  (`backdrop-filter: blur`, translucent white) containing the label
  and the Arrows.svg icon. The frost/blur is applied through a
  `mask-image` linear-gradient so it fades out toward the top edge
  (progressive blur, per the design) instead of a hard-edged bar.

## Out of scope (next phase)

- RSVP form (name + surname entry, attendance toggle) and its data
  persistence/backend.
- Any section below the hero.
- Desktop-specific layout (mobile-first, centered/letterboxed only).

## Open risks

- Google Fonts requires network access at load; acceptable per user.
- Figma-exported PNG asset URLs expire in ~7 days — must download and
  commit the actual bytes during implementation, not reference the
  live URLs.
- Autoplay-with-sound only works because it's gated behind the Click
  button (a user gesture) — this must remain a direct, synchronous
  result of the click handler in whatever browser API is used.
