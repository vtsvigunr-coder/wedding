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
