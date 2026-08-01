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
