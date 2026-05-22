import { useEffect, useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { EASE } from '../lib/gsap-motion';

type RevealOptions = {
  selector: string;
  /** ScrollTrigger start — domyślnie gdy blok jest wyraźnie w kadrze */
  start?: string;
  stagger?: number;
  y?: number;
  once?: boolean;
  /** scope = cała sekcja; first = pierwszy pasujący element; each = każdy element osobno */
  triggerMode?: 'scope' | 'first' | 'each';
  /** Opcjonalny element wyzwalający (np. kolumna tekstu) */
  triggerRef?: RefObject<HTMLElement | null>;
};

function resolveTrigger(
  scope: HTMLElement,
  els: HTMLElement[],
  mode: RevealOptions['triggerMode'],
  triggerRef?: RefObject<HTMLElement | null>,
): HTMLElement {
  if (triggerRef?.current) return triggerRef.current;
  if (mode === 'first' && els[0]) return els[0];
  return scope;
}

/** Wejście elementów przy scrollu — transform + opacity (GPU). */
export function useSectionReveal(
  scopeRef: RefObject<HTMLElement | null>,
  blocks: RevealOptions[],
  enabled = true,
) {
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || !enabled) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      blocksRef.current.forEach(
        ({
          selector,
          start = 'top 88%',
          stagger = 0.08,
          y = 28,
          once = true,
          triggerMode = 'scope',
          triggerRef,
        }) => {
          const els = gsap.utils.toArray<HTMLElement>(selector, scope);
          if (!els.length) return;

          const runReveal = (targets: HTMLElement[], trigger: HTMLElement) => {
            gsap.set(targets, { opacity: 0, y, force3D: true });
            gsap.to(targets, {
              opacity: 1,
              y: 0,
              duration: 0.9,
              stagger,
              ease: EASE.soft,
              force3D: true,
              scrollTrigger: {
                trigger,
                start,
                once,
                fastScrollEnd: true,
                invalidateOnRefresh: true,
              },
            });
          };

          if (triggerMode === 'each') {
            els.forEach((el) => runReveal([el], el));
            return;
          }

          const trigger = resolveTrigger(scope, els, triggerMode, triggerRef);
          runReveal(els, trigger);
        },
      );
    }, scope);

    return () => ctx.revert();
  }, [scopeRef, enabled]);
}

/** Parallax / scrub na sekcji końcowej. */
export function useScrollScrub(
  scopeRef: RefObject<HTMLElement | null>,
  targets: { ref: RefObject<HTMLElement | null>; vars: gsap.TweenVars }[],
  enabled = true,
) {
  const targetsRef = useRef(targets);
  targetsRef.current = targets;

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || !enabled) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      targetsRef.current.forEach(({ ref, vars }) => {
        const el = ref.current;
        if (!el) return;
        gsap.to(el, {
          ...vars,
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: scope,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.4,
          },
        });
      });
    }, scope);

    return () => ctx.revert();
  }, [scopeRef, enabled]);
}
