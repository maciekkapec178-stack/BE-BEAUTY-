import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const initGalleryAnimations = (
  pin: HTMLElement,
  track: HTMLElement,
  progressBar: HTMLElement | null,
): gsap.Context => {
  return gsap.context(() => {
    const panels = gsap.utils.toArray<HTMLElement>('.gallery-panel', track);
    const getScrollDist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const setProgress = progressBar ? gsap.quickSetter(progressBar, 'scaleX') : null;

    gsap.set(panels, {
      skewX: 0,
      rotate: 0,
      opacity: 1,
      scale: 1,
      transformOrigin: 'center center',
      force3D: true,
    });

    /* Przeciwny kierunek niż Atelier: start od końca tracku (prawa strona) → w lewo */
    const scrollTween = gsap.fromTo(
      track,
      { x: 0 },
      {
        x: () => -getScrollDist(),
        ease: 'none',
        force3D: true,
        scrollTrigger: {
          id: 'gallery-horizontal',
          trigger: pin,
          start: 'top top',
          end: () => `+=${getScrollDist()}`,
          pin: true,
          pinSpacing: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (setProgress) setProgress(self.progress);
          },
        },
      },
    );

    panels.forEach((panel) => {
      const media = panel.querySelector<HTMLElement>('.gallery-panel__media');
      if (!media) return;

      gsap.set(media, { xPercent: 0, scale: 1 });

      gsap.fromTo(
        media,
        { xPercent: 3 },
        {
          xPercent: -3,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            containerAnimation: scrollTween,
            start: 'right left',
            end: 'left right',
            scrub: 0.5,
          },
        },
      );
    });

    return () => {};
  }, pin);
};
