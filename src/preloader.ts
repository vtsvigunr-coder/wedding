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
