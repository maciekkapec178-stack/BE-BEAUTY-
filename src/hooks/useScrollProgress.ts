import { useEffect, useRef } from 'react';
import { onScrollY } from '../lib/scroll-controller';

/** Subtelny pasek postępu scrollu (Awwwards-style). */
export function useScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    let lastP = -1;

    const onResize = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    window.addEventListener('resize', onResize, { passive: true });

    const offScroll = onScrollY((y) => {
      const p = Math.min(1, Math.max(0, y / max));
      if (Math.abs(p - lastP) < 0.002) return;
      lastP = p;
      bar.style.transform = `scaleX(${p})`;
    });

    return () => {
      window.removeEventListener('resize', onResize);
      offScroll();
    };
  }, []);

  return barRef;
}
