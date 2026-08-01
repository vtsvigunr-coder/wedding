export function nextHeaderVisible(prevScrollY: number, currScrollY: number, wasVisible: boolean): boolean {
  if (currScrollY <= 0) return true;
  if (currScrollY > prevScrollY) return false; // scrolling down
  if (currScrollY < prevScrollY) return true; // scrolling up
  return wasVisible;
}

export function initHeader(): void {
  const header = document.getElementById('site-header');
  if (!header) return;

  let prevScrollY = window.scrollY;
  let visible = true;

  window.addEventListener(
    'scroll',
    () => {
      const currScrollY = window.scrollY;
      visible = nextHeaderVisible(prevScrollY, currScrollY, visible);
      header.classList.toggle('site-header--hidden', !visible);
      prevScrollY = currScrollY;
    },
    { passive: true },
  );
}
