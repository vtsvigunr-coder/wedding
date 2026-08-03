import { describe, expect, it, vi } from 'vitest';
import { initPreloader, nextPreloaderPhase } from './preloader';

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

/**
 * Builds the preloader's markup and hands back a video whose buffering state
 * the test controls, so a tap can be made to land on a video that has not been
 * fetched at all — which is what iOS Safari gives us, since it treats
 * `preload="auto"` as `none`.
 */
function mountPreloader(readyState: number) {
  document.body.innerHTML = `
    <section id="preloader">
      <video id="preloader-video"></video>
      <div id="preloader-hint"></div>
      <button id="preloader-click" type="button"></button>
    </section>
    <button id="sound-toggle"></button>
    <audio id="bg-music"></audio>
  `;

  const video = document.getElementById('preloader-video') as HTMLVideoElement;
  Object.defineProperty(video, 'readyState', { value: readyState, configurable: true });
  const play = vi.fn(() => Promise.resolve());
  video.play = play;

  const music = document.getElementById('bg-music') as HTMLAudioElement;
  music.play = vi.fn(() => Promise.resolve());
  music.pause = vi.fn();

  const clickButton = document.getElementById('preloader-click') as HTMLButtonElement;
  return { video, play, clickButton };
}

describe('initPreloader', () => {
  it('starts playback on a tap that lands before the video has buffered', () => {
    // HAVE_NOTHING: the browser declined to preload, so nothing is on the wire.
    const { play, clickButton } = mountPreloader(0);
    initPreloader();

    clickButton.click();

    // Without this the element sits at networkState IDLE forever: no fetch is
    // ever started, so `canplay` cannot fire and the button pulses for good.
    expect(play).toHaveBeenCalled();
  });

  it('still plays when the video is already buffered', () => {
    const { play, clickButton } = mountPreloader(4);
    initPreloader();

    clickButton.click();

    expect(play).toHaveBeenCalled();
  });
});
