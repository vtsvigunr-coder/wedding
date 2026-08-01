import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSoundIconClass, initSoundToggle } from './audio';

describe('getSoundIconClass', () => {
  it('returns the playing class when music is playing', () => {
    expect(getSoundIconClass(true)).toBe('site-header__sound--playing');
  });

  it('returns an empty string when music is paused', () => {
    expect(getSoundIconClass(false)).toBe('');
  });
});

describe('initSoundToggle', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="sound-toggle" aria-pressed="true"></button>
      <audio id="bg-music"></audio>
    `;
    const music = document.getElementById('bg-music') as HTMLAudioElement;
    // jsdom doesn't implement media playback; stand in with fakes that
    // flip `paused` and fire the same events the real element would.
    music.play = vi.fn(() => {
      Object.defineProperty(music, 'paused', { value: false, configurable: true });
      music.dispatchEvent(new Event('play'));
      return Promise.resolve();
    });
    music.pause = vi.fn(() => {
      Object.defineProperty(music, 'paused', { value: true, configurable: true });
      music.dispatchEvent(new Event('pause'));
    });
  });

  it('starts paused with the icon in its non-playing state', () => {
    initSoundToggle();

    const toggle = document.getElementById('sound-toggle')!;
    expect(toggle.classList.contains('site-header__sound--playing')).toBe(false);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking toggles music playback and the icon class together', () => {
    initSoundToggle();
    const toggle = document.getElementById('sound-toggle')!;

    toggle.click();
    expect(toggle.classList.contains('site-header__sound--playing')).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');

    toggle.click();
    expect(toggle.classList.contains('site-header__sound--playing')).toBe(false);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
  });
});
