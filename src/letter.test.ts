import { describe, expect, it } from 'vitest';
import { letterFrameIndex, letterFrameSrc, stageProgress } from './letter';

describe('stageProgress', () => {
  it('is zero before the stage reaches the top of the viewport', () => {
    expect(stageProgress(400, 2000, 800)).toBe(0);
  });

  it('is zero exactly when the stage pins', () => {
    expect(stageProgress(0, 2000, 800)).toBe(0);
  });

  it('reaches one when the stage has been scrolled by its surplus height', () => {
    expect(stageProgress(-1200, 2000, 800)).toBe(1);
  });

  it('is linear across the pinned range', () => {
    expect(stageProgress(-600, 2000, 800)).toBeCloseTo(0.5);
  });

  it('stays clamped once the stage has scrolled past', () => {
    expect(stageProgress(-5000, 2000, 800)).toBe(1);
  });

  it('treats a stage no taller than the viewport as done once it pins', () => {
    expect(stageProgress(0, 800, 800)).toBe(1);
    expect(stageProgress(50, 800, 800)).toBe(0);
  });
});

describe('letterFrameIndex', () => {
  it('starts on the closed envelope', () => {
    expect(letterFrameIndex(0, 60)).toBe(0);
  });

  it('reaches the last frame at the open-by point, not at the end of the stage', () => {
    expect(letterFrameIndex(0.7, 60)).toBe(59);
  });

  it('holds the open envelope through the rest of the stage', () => {
    expect(letterFrameIndex(0.85, 60)).toBe(59);
    expect(letterFrameIndex(1, 60)).toBe(59);
  });

  it('scrubs proportionally before the open-by point', () => {
    expect(letterFrameIndex(0.35, 60)).toBe(30);
  });

  it('never indexes past the sequence for other frame counts', () => {
    expect(letterFrameIndex(1, 1)).toBe(0);
    expect(letterFrameIndex(0.5, 2)).toBe(1);
  });

  it('returns zero rather than -1 for an empty sequence', () => {
    expect(letterFrameIndex(0.5, 0)).toBe(0);
  });
});

describe('letterFrameSrc', () => {
  it('zero-pads the frame number to match the built filenames', () => {
    expect(letterFrameSrc(0)).toBe('/letter/frame-00.webp');
    expect(letterFrameSrc(7)).toBe('/letter/frame-07.webp');
    expect(letterFrameSrc(59)).toBe('/letter/frame-59.webp');
  });
});
