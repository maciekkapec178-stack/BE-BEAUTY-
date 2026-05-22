import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Globalna konfiguracja GSAP — luksusowy timing, synchronizacja z Lenis. */
export function initGsapMotion(): void {
  gsap.registerPlugin(ScrollTrigger);

  gsap.config({
    force3D: true,
    nullTargetWarn: false,
  });

  /* lagSmoothing(0) — kluczowe dla Lenis + GSAP ticker sync */
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.config({
    limitCallbacks: true,
    ignoreMobileResize: true,
    syncInterval: 40, // szybszy sync dla płynniejszego horizontal scruba
  });

  ScrollTrigger.defaults({
    fastScrollEnd: true,
    /* BEZ scroller: document.documentElement — Lenis zarządza native scrollem */
  });
}

/** Easingi marki BE BEAUTY */
export const EASE = {
  luxe: 'power4.out',
  soft: 'power3.out',
  scroll: 'none',
  reveal: 'power4.inOut',
} as const;
