import './style.css';
import './header.css';
import './preloader.css';
import './hero.css';
import { initHeader } from './header';
import { initSoundToggle } from './audio';
import { initPreloader } from './preloader';

initHeader();
initSoundToggle();
initPreloader(() => {
  // Hero is already in the DOM (Task 1/5); nothing further needed here
  // beyond what initPreloader itself does (unlock scroll, fade preloader).
});
