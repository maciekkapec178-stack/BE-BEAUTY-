import type Lenis from 'lenis';

declare global {
  interface Window {
    __beBeautyLenis?: Lenis | null;
  }
}

type ScrollListener = (scrollY: number) => void;

let lenisInstance: Lenis | null = null;
let lenisRafStarter: (() => void) | null = null;
const listeners = new Set<ScrollListener>();
let pendingY = 0;
let notifyRaf = 0;

/** Rejestruje starter pętli rAF (useSmoothScroll). */
export function setLenisRafStarter(starter: (() => void) | null): void {
  lenisRafStarter = starter;
}

function kickLenisRaf(): void {
  lenisRafStarter?.();
}

export function notifyScroll(scrollY?: number): void {
  pendingY = scrollY ?? getScrollY();
  if (notifyRaf) return;
  notifyRaf = requestAnimationFrame(() => {
    notifyRaf = 0;
    flushScrollListeners();
  });
}

/** Natychmiastowe powiadomienie — z pętli Lenis rAF (bez drugiego rAF). */
export function flushScrollListeners(scrollY?: number): void {
  if (scrollY !== undefined) pendingY = scrollY;
  else pendingY = getScrollY();
  if (notifyRaf) {
    cancelAnimationFrame(notifyRaf);
    notifyRaf = 0;
  }
  listeners.forEach((fn) => fn(pendingY));
}

export function setLenis(lenis: Lenis | null): void {
  lenisInstance = lenis;
  if (typeof window !== 'undefined') {
    window.__beBeautyLenis = lenis;
  }
  if (lenis) {
    notifyScroll(lenis.scroll);
  }
}

/** Blokada scrollu (loader) — bez niszczenia Lenis. */
export function setScrollLocked(locked: boolean): void {
  if (!lenisInstance) return;
  if (locked) {
    lenisInstance.stop();
  } else {
    ensureScrollUnlocked();
  }
}

/** Odblokowuje scroll po loaderze. */
export function ensureScrollUnlocked(): void {
  if (!lenisInstance) return;
  if (lenisInstance.isStopped) lenisInstance.start();
  kickLenisRaf();
  lenisInstance.resize();
  notifyScroll(lenisInstance.scroll);
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}

export function getScrollY(): number {
  return lenisInstance?.scroll ?? window.scrollY;
}

export function onScrollY(listener: ScrollListener): () => void {
  listeners.add(listener);
  listener(getScrollY());
  return () => listeners.delete(listener);
}

function resolveElement(target: string | HTMLElement): HTMLElement | null {
  if (typeof target === 'string') {
    const sel = target.startsWith('#') ? target : `#${target}`;
    return document.querySelector<HTMLElement>(sel);
  }
  return target;
}

export function scrollToAnchor(
  target: string | HTMLElement,
  options?: { offset?: number },
): void {
  const el = resolveElement(target);
  if (!el) return;

  const offset = options?.offset ?? -88;

  if (lenisInstance) {
    if (lenisInstance.isStopped) lenisInstance.start();
    kickLenisRaf();
    lenisInstance.scrollTo(el, { offset, duration: 1.15, easing: (t) => 1 - (1 - t) ** 3 });
    return;
  }

  const y = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top: y, behavior: 'smooth' });
}
