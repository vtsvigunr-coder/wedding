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

  const reveal = () => {
    clickButton.classList.remove('preloader__click--waiting');
    hint.classList.add('preloader__hint--gone');
    if (soundToggle) soundToggle.disabled = false;
    // Only now, on the visitor's own tap: the track is 1.4 MB and preloading
    // it would have competed with the video for the connection.
    music?.play();
  };

  clickButton.addEventListener('click', () => {
    phase = nextPreloaderPhase(phase, 'click');
    if (phase !== 'playing') return;

    // `play()` goes first, synchronously inside the gesture, and it goes
    // unconditionally. It is doing two jobs. It is what unlocks media playback
    // on iOS, which only counts a call made during the tap itself — deferring
    // it to an event handler spends the gesture. And it is what puts the file
    // on the wire at all: iOS Safari treats `preload="auto"` as `none`, so the
    // element can still be sitting at HAVE_NOTHING with networkState IDLE,
    // fetching nothing. Waiting for `canplay` in that state waits forever —
    // the download that would fire it is the one this call starts.
    const started = video.play();

    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      // Already buffered: lift the hint now rather than waiting a frame.
      reveal();
    } else {
      // Otherwise hold the hint on screen, marked as waiting, so the tap
      // visibly registers while the file arrives, and lift it when the video
      // actually starts moving.
      clickButton.classList.add('preloader__click--waiting');
      video.addEventListener('playing', reveal, { once: true });
    }

    started?.catch(rewind);
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
