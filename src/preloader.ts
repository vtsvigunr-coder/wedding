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

  // No `load()` here, tempting as it is: the element is already fetching from
  // `preload="auto"`, and calling it resets that and starts the download over —
  // measured as the file arriving twice. Phones decide for themselves whether
  // to honour the preload at all, so the waiting state below is what covers a
  // tap that lands before the video has arrived.

  const finish = () => {
    preloader.classList.add('preloader--finished');
    document.body.classList.remove('scroll-locked');
  };

  const rewind = () => {
    // Playback failed to start (e.g. rejected on a flaky connection) — let the
    // visitor try again instead of leaving them stuck.
    phase = 'idle';
    clickButton.classList.remove('preloader__click--waiting');
    hint.classList.remove('preloader__hint--gone');
    if (soundToggle) soundToggle.disabled = true;
    music?.pause();
  };

  const start = () => {
    clickButton.classList.remove('preloader__click--waiting');
    hint.classList.add('preloader__hint--gone');
    if (soundToggle) soundToggle.disabled = false;
    video.play().catch(rewind);
    // Only now, on the visitor's own tap: the track is 1.4 MB and preloading
    // it would have competed with the video for the connection.
    music?.play();
  };

  clickButton.addEventListener('click', () => {
    phase = nextPreloaderPhase(phase, 'click');
    if (phase !== 'playing') return;

    // Enough of the video buffered to play it through: go straight in.
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      start();
      return;
    }

    // Otherwise hold the hint on screen, marked as waiting, so the tap visibly
    // registers rather than appearing to do nothing while the file arrives.
    // Not `load()` again: that would reset the element and throw away whatever
    // has already arrived. The fetch is under way — just wait for it.
    clickButton.classList.add('preloader__click--waiting');
    video.addEventListener('canplay', start, { once: true });
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
