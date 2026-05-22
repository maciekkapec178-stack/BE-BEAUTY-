import { getLenis } from './scroll-controller';

/** Wymusza pozycję scroll na samej górze strony */
export function scrollToTop(): void {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  getLenis()?.scrollTo(0, { immediate: true });
}
