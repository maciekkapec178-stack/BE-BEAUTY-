import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { scrollToTop } from '../lib/scroll';
import { bindLenisScrollTrigger, unbindLenisScrollTrigger } from '../lib/lenis-scroll-trigger';
import { flushScrollListeners, setLenis, setLenisRafStarter } from '../lib/scroll-controller';

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis + GSAP ticker sync — oficjalny wzorzec.
 *
 * Kluczowe zasady:
 * 1. autoRaf = false → Lenis NIE ma własnej pętli RAF
 * 2. GSAP ticker napędza Lenis.raf() → idealna synchronizacja co klatkę
 * 3. lagSmoothing(0) → żadne "łapanie" klatek nie psuje scruba
 * 4. ScrollTrigger.update() wywoływany przy każdym scroll evencie Lenis
 */
export function useSmoothScroll() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollToTop();

    if (prefersReduced) {
      setLenis(null);
      return;
    }

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      infinite: false,
      autoRaf: false, // ← kluczowe: GSAP ticker steruje Lenis
    });

    /* Każdy scroll Lenis → natychmiastowy update ScrollTrigger + listenerów */
    const onScroll = () => {
      ScrollTrigger.update();
      flushScrollListeners(lenis.scroll);
    };

    lenis.on('scroll', onScroll);
    setLenis(lenis);
    lenis.stop();
    lenis.scrollTo(0, { immediate: true });

    bindLenisScrollTrigger(lenis);

    /* GSAP ticker napędza Lenis — jedna wspólna pętla RAF */
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    setLenisRafStarter(() => {
      if (lenis.isStopped) lenis.start();
      lenis.resize();
      ScrollTrigger.update();
    });

    document.documentElement.classList.add('lenis', 'lenis-smooth');

    let resizeTimer = 0;
    const onResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizeTimer = 0;
        lenis.resize();
        ScrollTrigger.refresh();
      }, 150);
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      if (resizeTimer) window.clearTimeout(resizeTimer);
      lenis.off('scroll', onScroll);
      gsap.ticker.remove(tickerCallback);
      setLenisRafStarter(null);
      unbindLenisScrollTrigger();
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
      lenis.destroy();
      setLenis(null);
    };
  }, []);
}
