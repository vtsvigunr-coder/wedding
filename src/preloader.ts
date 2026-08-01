export type PreloaderPhase = 'idle' | 'playing' | 'done';

export function nextPreloaderPhase(phase: PreloaderPhase, event: 'click' | 'video-ended'): PreloaderPhase {
  if (phase === 'idle' && event === 'click') return 'playing';
  if (phase === 'playing' && event === 'video-ended') return 'done';
  return phase;
}

export function initPreloader(): void {
  const preloader = document.getElementById('preloader');
  const hint = document.getElementById('preloader-hint');
  const clickButton = document.getElementById('preloader-click');
  const soundToggle = document.getElementById('sound-toggle') as HTMLButtonElement | null;
  const video = document.getElementById('preloader-video') as HTMLVideoElement | null;
  const music = document.getElementById('bg-music') as HTMLAudioElement | null;
  if (!preloader || !hint || !clickButton || !video) return;

  let phase: PreloaderPhase = 'idle';
  document.body.classList.add('scroll-locked');
  if (soundToggle) soundToggle.disabled = true;

  const finish = () => {
    preloader.classList.add('preloader--finished');
    document.body.classList.remove('scroll-locked');
  };

  clickButton.addEventListener('click', () => {
    phase = nextPreloaderPhase(phase, 'click');
    if (phase !== 'playing') return;

    hint.classList.add('preloader__hint--gone');
    if (soundToggle) soundToggle.disabled = false;

    video.play().catch(() => {
      // Playback failed to start (e.g. rejected on a flaky connection) —
      // let the user try again instead of leaving them stuck.
      phase = 'idle';
      hint.classList.remove('preloader__hint--gone');
      if (soundToggle) soundToggle.disabled = true;
      music?.pause();
    });
    music?.play();
  });

  video.addEventListener('ended', () => {
    phase = nextPreloaderPhase(phase, 'video-ended');
    if (phase !== 'done') return;
    finish();
  });

  video.addEventListener('error', () => {
    // Playback started but broke mid-way (network stall, decode error) —
    // freeze on whatever's visible rather than leaving the user stuck.
    phase = 'done';
    finish();
  });
}
