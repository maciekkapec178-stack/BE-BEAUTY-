import type Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let boundLenis: Lenis | null = null;

/** Po refresh ST dopasuj wymiary Lenis. Scroll → update w useSmoothScroll. */
export function bindLenisScrollTrigger(lenis: Lenis): void {
  if (boundLenis === lenis) return;
  unbindLenisScrollTrigger();
  boundLenis = lenis;
  ScrollTrigger.addEventListener('refresh', onLenisRefresh);
  ScrollTrigger.refresh();
}

function onLenisRefresh(): void {
  boundLenis?.resize();
}

export function unbindLenisScrollTrigger(): void {
  boundLenis = null;
  ScrollTrigger.removeEventListener('refresh', onLenisRefresh);
}
