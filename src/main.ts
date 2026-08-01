import './style.css';
import './header.css';
import './preloader.css';
import { initHeader } from './header';
import { initSoundToggle } from './audio';
import { initPreloader } from './preloader';

initHeader();
initSoundToggle();
initPreloader(() => {
  // Nothing further needed: initPreloader leaves the video frozen on its
  // last frame and reveals the scroll-down indicator on top of it.
});
