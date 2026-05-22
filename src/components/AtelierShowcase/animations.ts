import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const initAtelierAnimations = (
  pin: HTMLElement,
  track: HTMLElement,
  progressBar: HTMLElement | null,
): gsap.Context => {
  return gsap.context(() => {
    const panels = gsap.utils.toArray<HTMLElement>('.atelier-panel', track);
    const getScrollDist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const setProgress = progressBar ? gsap.quickSetter(progressBar, 'scaleX') : null;

    gsap.set(panels, {
      skewX: 0,
      rotate: 0,
      transformOrigin: 'center center',
      force3D: true,
    });

    const scrollTween = gsap.to(track, {
      x: () => -getScrollDist(),
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        id: 'atelier-horizontal',
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
    });

    panels.forEach((panel) => {
      const isPhoto = panel.classList.contains('atelier-panel--photo');
      const isDivider = panel.classList.contains('atelier-panel--divider');
      const isCta = panel.classList.contains('atelier-panel--cta');
      const media = panel.querySelector<HTMLElement>('.atelier-panel__media');
      const content = panel.querySelector<HTMLElement>('.atelier-panel__content');

      const stBase = {
        trigger: panel,
        containerAnimation: scrollTween,
      };

      if (isPhoto) {
        gsap.fromTo(
          panel,
          { scale: 0.9, opacity: 0.55 },
          {
            scale: 1,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              ...stBase,
              start: 'left 92%',
              end: 'left 38%',
              scrub: 0.45,
            },
          },
        );

        if (media) {
          gsap.fromTo(
            media,
            { xPercent: -5, scale: 1.07 },
            {
              xPercent: 5,
              scale: 1.07,
              ease: 'none',
              scrollTrigger: {
                ...stBase,
                start: 'left right',
                end: 'right left',
                scrub: 0.65,
              },
            },
          );
        }
        return;
      }

      if (isDivider) {
        gsap.fromTo(
          panel,
          { y: 32, opacity: 0.45 },
          {
            y: 0,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              ...stBase,
              start: 'left 90%',
              end: 'left 42%',
              scrub: 0.5,
            },
          },
        );

        if (content?.children.length) {
          gsap.fromTo(
            content.children,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: 'none',
              stagger: 0.08,
              scrollTrigger: {
                ...stBase,
                start: 'left 86%',
                end: 'left 48%',
                scrub: 0.5,
              },
            },
          );
        }
        return;
      }

      if (isCta) {
        gsap.fromTo(
          panel,
          { scale: 0.94, opacity: 0.65 },
          {
            scale: 1,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              ...stBase,
              start: 'left 94%',
              end: 'left 50%',
              scrub: 0.45,
            },
          },
        );
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-inview', entry.isIntersecting);
        });
      },
      { threshold: 0.35 },
    );

    panels.forEach((p) => observer.observe(p));

    return () => {
      observer.disconnect();
    };
  }, pin);
};
