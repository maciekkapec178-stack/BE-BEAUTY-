import { ScrollTrigger } from 'gsap/ScrollTrigger';

let refreshTimer = 0;

/** Pełny refresh — debounce (mapa, resize), bez pętli z Lenis. */
export function scheduleScrollTriggerRefresh(delayMs = 300): void {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    refreshTimer = 0;
    ScrollTrigger.refresh();
  }, delayMs);
}

export function shouldSyncScrollTrigger(scrollY: number, velocity: number): boolean {
  const y = Math.round(scrollY * 10) / 10;
  const last = shouldSyncScrollTrigger.lastY;
  shouldSyncScrollTrigger.lastY = y;
  return Math.abs(y - last) > 0.35 || Math.abs(velocity) > 0.06;
}
shouldSyncScrollTrigger.lastY = -1;

/** Czy w tej klatce synchronizować Lenis → ScrollTrigger i listenery scrollu. */
export function shouldSyncScrollFrame(scrollY: number, velocity: number): boolean {
  if (ScrollTrigger.isScrolling()) return true;
  return shouldSyncScrollTrigger(scrollY, velocity);
}
