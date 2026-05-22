/**
 * Diagnostyka scrolla (Lenis + GSAP ScrollTrigger).
 * Uruchamia się automatycznie w DEV — wynik w konsoli przeglądarki.
 * API: window.__scrollDiag
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis, getScrollY } from './scroll-controller';

type DiagLevel = 'ok' | 'warn' | 'error' | 'info';

interface DiagCheck {
  id: string;
  level: DiagLevel;
  message: string;
  detail?: unknown;
}

interface ScrollDiagApi {
  report: () => DiagCheck[];
  print: () => void;
  watch: (ms?: number) => () => void;
  testWheel: () => void;
  unlock: () => void;
}

declare global {
  interface Window {
    __beBeautyLenis?: import('lenis').default | null;
    __scrollDiag?: ScrollDiagApi;
  }
}

const LOG_PREFIX = '[BE BEAUTY · scroll diag]';
const LEVEL_ICON: Record<DiagLevel, string> = {
  ok: '✓',
  warn: '⚠',
  error: '✗',
  info: '·',
};

function fmt(n: number | undefined | null, digits = 1): string {
  return Number.isFinite(n) ? (n as number).toFixed(digits) : '—';
}

function css(el: Element | null): CSSStyleDeclaration | null {
  return el ? getComputedStyle(el) : null;
}

function docScrollHeight(): number {
  return Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  );
}

function isScrollable(): boolean {
  return docScrollHeight() > window.innerHeight + 2;
}

function collectChecks(): DiagCheck[] {
  const checks: DiagCheck[] = [];
  const lenis = getLenis() ?? window.__beBeautyLenis ?? null;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  const body = document.body;
  const htmlStyle = css(html);
  const bodyStyle = css(body);
  const lenisY = lenis?.scroll ?? null;
  const windowY = window.scrollY;
  const controllerY = getScrollY();

  checks.push({
    id: 'env',
    level: import.meta.env.DEV ? 'info' : 'info',
    message: `Tryb: ${import.meta.env.MODE}, viewport ${window.innerWidth}×${window.innerHeight}`,
  });

  checks.push({
    id: 'reduced-motion',
    level: reduced ? 'warn' : 'ok',
    message: reduced
      ? 'prefers-reduced-motion: reduce — Lenis wyłączony (native scroll)'
      : 'Animacje włączone — oczekiwany Lenis',
  });

  if (reduced) {
    checks.push({
      id: 'reduced-motion-hint',
      level: 'info',
      message:
        'Test pełnego scrolla: Windows Ustawienia → Dostępność → Efekty wizualne → wyłącz „Animacje”, albo Chrome DevTools → ⋮ → More tools → Rendering → odznacz prefers-reduced-motion',
    });
  }

  if (!reduced && !lenis) {
    checks.push({
      id: 'lenis-missing',
      level: 'error',
      message: 'Brak instancji Lenis (getLenis / __beBeautyLenis)',
    });
  } else if (lenis) {
    checks.push({
      id: 'lenis-present',
      level: 'ok',
      message: 'Lenis aktywny',
      detail: {
        scroll: lenis.scroll,
        isStopped: lenis.isStopped,
        isScrolling: lenis.isScrolling,
        actualScroll: lenis.actualScroll,
        limit: lenis.limit,
        options: lenis.options,
      },
    });

    if (lenis.isStopped) {
      checks.push({
        id: 'lenis-stopped',
        level: 'warn',
        message: 'Lenis.isStopped === true — scroll zablokowany (loader / setScrollLocked)',
      });
    }

    const lenisScroll = lenis.scroll ?? 0;
    const delta = Math.abs(lenisScroll - windowY);
    if (delta > 8) {
      checks.push({
        id: 'lenis-window-drift',
        level: 'warn',
        message: `Rozjazd Lenis (${fmt(lenisScroll)}) vs window.scrollY (${fmt(windowY)}) = ${fmt(delta)}px`,
      });
    } else {
      checks.push({
        id: 'lenis-window-sync',
        level: 'ok',
        message: `Lenis i window.scrollY zsynchronizowane (Δ ${fmt(delta)}px)`,
      });
    }
  }

  checks.push({
    id: 'scroll-y',
    level: 'info',
    message: `Pozycja: getScrollY()=${fmt(controllerY)}, window=${fmt(windowY)}${lenisY != null ? `, lenis=${fmt(lenisY)}` : ''}`,
  });

  const scrollH = docScrollHeight();
  checks.push({
    id: 'scroll-height',
    level: isScrollable() ? 'ok' : 'warn',
    message: `Wysokość dokumentu: ${scrollH}px (inner ${window.innerHeight}px)`,
    detail: { scrollable: isScrollable(), clientHeight: html.clientHeight },
  });

  if (html.classList.contains('lenis-stopped')) {
    checks.push({
      id: 'lenis-stopped-class',
      level: 'warn',
      message: 'html.lenis-stopped — overflow:hidden na html (blokada scrolla)',
    });
  }

  const overflowBlockers: string[] = [];
  if (htmlStyle?.overflow === 'hidden' || htmlStyle?.overflowY === 'hidden') {
    overflowBlockers.push(`html overflow=${htmlStyle.overflow} overflowY=${htmlStyle.overflowY}`);
  }
  if (bodyStyle?.overflow === 'hidden' || bodyStyle?.overflowY === 'hidden') {
    overflowBlockers.push(`body overflow=${bodyStyle.overflow} overflowY=${bodyStyle.overflowY} (inline: ${body.style.overflow || '—'})`);
  }
  if (overflowBlockers.length) {
    checks.push({
      id: 'overflow-hidden',
      level: 'error',
      message: `Overflow blokuje scroll: ${overflowBlockers.join('; ')}`,
    });
  } else {
    checks.push({
      id: 'overflow-ok',
      level: 'ok',
      message: 'html/body nie mają overflow:hidden na osi Y',
    });
  }

  if (!html.classList.contains('lenis') && !reduced) {
    checks.push({
      id: 'lenis-class',
      level: 'warn',
      message: 'Brak klasy html.lenis — useSmoothScroll może nie zdążyć lub się wyłączył',
    });
  }

  const stAll = ScrollTrigger.getAll();
  const isDesktop = window.matchMedia('(min-width: 900px)').matches;
  const stExpected = !reduced && isDesktop;

  if (reduced) {
    checks.push({
      id: 'scrolltrigger-count',
      level: 'info',
      message: `ScrollTrigger: ${stAll.length} — oczekiwane 0 (reduced-motion wyłącza pin/horizontal w Atelier, Hero itd.)`,
    });
  } else if (!isDesktop) {
    checks.push({
      id: 'scrolltrigger-count',
      level: 'info',
      message: `ScrollTrigger: ${stAll.length} — na mobile (<900px) Atelier używa scroll-snap zamiast ST`,
    });
  } else if (stAll.length === 0) {
    checks.push({
      id: 'scrolltrigger-count',
      level: 'warn',
      message: 'ScrollTrigger: 0 instancji — na desktopie po loaderze powinny być triggery (Atelier pin)',
      detail: 'Sprawdź czy PrestigeLoading zakończył się (loaded) i czy initAtelierAnimations się wykonał',
    });
  } else {
    checks.push({
      id: 'scrolltrigger-count',
      level: 'ok',
      message: `ScrollTrigger: ${stAll.length} instancji`,
      detail: stAll.map((st) => ({
        trigger:
          (st.trigger as Element | undefined)?.id ||
          (st.trigger as Element | undefined)?.className?.toString?.()?.slice(0, 40) ||
          st.trigger,
        start: st.start,
        end: st.end,
        pin: st.pin,
        isActive: st.isActive,
      })),
    });
  }

  if (stExpected && stAll.length === 0) {
    checks.push({
      id: 'st-hint',
      level: 'info',
      message:
        'Jeśli loader trwa >3s, uruchom window.__scrollDiag.print() po zniknięciu preloadera lub __scrollDiag.watch() i przewiń stronę',
    });
  }

  /* gsap.ticker.fps() to setter — nie zwraca wartości; raportujemy frame/time */
  const tickerFrame = gsap.ticker.frame;
  const tickerTime = gsap.ticker.time;
  checks.push({
    id: 'gsap-ticker',
    level: tickerFrame > 0 ? 'ok' : 'info',
    message: `GSAP ticker: frame=${tickerFrame}, time=${fmt(tickerTime, 0)}ms (lagSmoothing=0 dla Lenis)`,
  });

  const pinned = document.querySelectorAll('[data-pin], .pin-spacer');
  if (pinned.length) {
    checks.push({
      id: 'pin-spacers',
      level: 'info',
      message: `Elementy pin / pin-spacer: ${pinned.length}`,
    });
  }

  return checks;
}

function printReport(checks: DiagCheck[]): void {
  const counts = { ok: 0, warn: 0, error: 0, info: 0 };
  for (const c of checks) counts[c.level]++;

  console.groupCollapsed(
    `%c${LOG_PREFIX} Raport (${counts.error} bł., ${counts.warn} ostrz., ${counts.ok} OK)`,
    'color:#C4A574;font-weight:bold',
  );
  for (const c of checks) {
    const color =
      c.level === 'error' ? '#e57373' : c.level === 'warn' ? '#ffb74d' : c.level === 'ok' ? '#81c784' : '#90a4ae';
    const line = `${LEVEL_ICON[c.level]} [${c.id}] ${c.message}`;
    if (c.detail !== undefined) {
      console.log(`%c${line}`, `color:${color}`, c.detail);
    } else {
      console.log(`%c${line}`, `color:${color}`);
    }
  }
  console.groupEnd();
  console.info(
    `${LOG_PREFIX} API: window.__scrollDiag — .print() .report() .watch(5000) .testWheel() .unlock()`,
  );
}

function createApi(): ScrollDiagApi {
  return {
    report: collectChecks,
    print: () => printReport(collectChecks()),
    watch(ms = 5000) {
      let lastY = getScrollY();
      let wheelCount = 0;
      let scrollEvents = 0;
      const lenis = getLenis();

      const onWheel = () => {
        wheelCount += 1;
      };
      const onNativeScroll = () => {
        scrollEvents += 1;
      };

      window.addEventListener('wheel', onWheel, { passive: true });
      window.addEventListener('scroll', onNativeScroll, { passive: true });

      const lenisHandler = () => {
        scrollEvents += 1;
      };
      lenis?.on('scroll', lenisHandler);

      const interval = window.setInterval(() => {
        const y = getScrollY();
        const moved = Math.abs(y - lastY) > 0.5;
        console.log(
          `${LOG_PREFIX} [watch] Y=${fmt(y)} Δ=${fmt(y - lastY)} wheel=${wheelCount} scrollEv=${scrollEvents} lenisStopped=${lenis?.isStopped ?? 'n/a'} moved=${moved}`,
        );
        if (wheelCount > 0 && !moved && lenis?.isStopped) {
          console.warn(`${LOG_PREFIX} Kółko myszy, ale scroll stoi — Lenis zatrzymany`);
        } else if (wheelCount > 0 && !moved) {
          console.warn(`${LOG_PREFIX} Kółko myszy bez zmiany Y — możliwa blokada overflow / pin / wysokość 0`);
        }
        wheelCount = 0;
        scrollEvents = 0;
        lastY = y;
      }, ms);

      console.info(`${LOG_PREFIX} watch co ${ms}ms — zwróć funkcję cleanup z .watch()`);

      return () => {
        window.clearInterval(interval);
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('scroll', onNativeScroll);
        lenis?.off('scroll', lenisHandler);
        console.info(`${LOG_PREFIX} watch zatrzymany`);
      };
    },
    testWheel() {
      const before = getScrollY();
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true }));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const after = getScrollY();
          console.log(`${LOG_PREFIX} testWheel: ${fmt(before)} → ${fmt(after)} (Δ ${fmt(after - before)})`);
        });
      });
    },
    unlock() {
      const lenis = getLenis();
      if (lenis?.isStopped) {
        lenis.start();
        document.documentElement.classList.remove('lenis-stopped');
        console.info(`${LOG_PREFIX} Lenis.start() wywołane`);
      }
      document.body.style.overflow = '';
      ScrollTrigger.refresh();
      console.info(`${LOG_PREFIX} unlock: body overflow wyczyszczone, ST.refresh()`);
    },
  };
}

function waitForLenis(maxMs = 8000): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || getLenis() || performance.now() - start > maxMs) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/** Uruchamia diagnostykę po załadowaniu strony (tylko DEV). */
export function initScrollDiagnostics(): void {
  if (!import.meta.env.DEV) return;

  window.__scrollDiag = createApi();

  const run = async () => {
    await waitForLenis();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    printReport(collectChecks());

    window.setTimeout(() => {
      console.log(`${LOG_PREFIX} Raport po 3s (po loaderze):`);
      printReport(collectChecks());
    }, 3000);

    window.setTimeout(() => {
      console.log(`${LOG_PREFIX} Raport po 8s (animacje + Atelier):`);
      printReport(collectChecks());
    }, 8000);
  };

  if (document.readyState === 'complete') {
    void run();
  } else {
    window.addEventListener('load', () => void run(), { once: true });
  }
}
