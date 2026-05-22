import React, { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { C, S } from '../../theme';
import { site, getBooksyBookingUrl } from '../../lib/site-content';
import { getAtelierFrame } from '../../lib/atelier-images';
import { EASE } from '../../lib/gsap-motion';
import { scheduleScrollTriggerRefresh } from '../../lib/scroll-sync';
import './Academy.css';

gsap.registerPlugin(ScrollTrigger);

type AcademyContent = {
  image?: string;
  imageFocus?: string;
  airbrush?: {
    title: string;
    intro: string;
    howTitle: string;
    howBody: string;
  };
  description?: string;
};

const academyContent = site.academy as AcademyContent;
const atelierAcademy = site.atelier.find((item) => item.id === 'academy');
const ACADEMY_IMAGE =
  academyContent.image ??
  atelierAcademy?.image ??
  '/images/social/441eb63719574b5faa85e10ea7a6cd6a.jpeg';
const ACADEMY_IMAGE_FOCUS =
  academyContent.imageFocus ?? atelierAcademy?.imageFocus ?? 'center center';
const ACADEMY_AIRBRUSH = academyContent.airbrush;
const academyFrame = getAtelierFrame('academy', 'wide', ACADEMY_IMAGE_FOCUS);

function finishRevealIfVisible(tween: gsap.core.Tween, el: HTMLElement, threshold = 0.88): void {
  const st = tween.scrollTrigger;
  if (!st || st.progress > 0) return;
  const top = el.getBoundingClientRect().top;
  if (top < window.innerHeight * threshold) {
    tween.progress(1);
  }
}

const Academy: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  const imageWrapStyle = useMemo(
    () => ({ aspectRatio: academyFrame.aspectRatio }),
    [],
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const wrap = imgWrapRef.current;
      const img = imgRef.current;

      if (wrap && img) {
        gsap.set(wrap, { clipPath: 'inset(0% 100% 0% 0%)' });
        const clipTween = gsap.to(wrap, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.4,
          ease: EASE.reveal,
          scrollTrigger: {
            trigger: wrap,
            start: 'top 88%',
            once: true,
            invalidateOnRefresh: true,
          },
        });

        const syncReveal = () => {
          finishRevealIfVisible(clipTween, wrap);
        };
        requestAnimationFrame(syncReveal);
        window.setTimeout(syncReveal, 400);
      }

      const staggers = copyRef.current?.querySelectorAll('[data-academy-reveal]');
      if (staggers?.length && copyRef.current) {
        gsap.set(staggers, { y: 28, opacity: 0, force3D: true });
        gsap.to(staggers, {
          y: 0,
          opacity: 1,
          duration: 0.95,
          stagger: 0.1,
          ease: EASE.soft,
          force3D: true,
          scrollTrigger: {
            trigger: copyRef.current,
            start: 'top 85%',
            once: true,
            invalidateOnRefresh: true,
          },
        });
      }

      scheduleScrollTriggerRefresh(200);
    }, section);

    return () => ctx.revert();
  }, []);

  const onImageReady = () => scheduleScrollTriggerRefresh(250);

  return (
    <section ref={sectionRef} id="academy" className="academy-section">
      <div className="academy-section__inner">
        <div className="academy-section__grid">
          {/* Left Side: Copy */}
          <div ref={copyRef} className="academy__content">
            <p data-academy-reveal className="academy__eyebrow" style={{ fontFamily: S.sans, color: 'rgba(196,168,130,0.7)' }}>
              Brow Academy
            </p>
            <h2 data-academy-reveal className="academy__title" style={{ fontFamily: S.serif, color: 'white' }}>
              Zostań<br />
              <em style={{ color: C.nude }}>Ekspertem</em>
            </h2>
            <p data-academy-reveal className="academy__desc" style={{ fontFamily: S.sans, color: 'rgba(255,255,255,0.48)' }}>
              {academyContent.description || site.academy.description}
            </p>

            {ACADEMY_AIRBRUSH && (
              <div data-academy-reveal className="academy__airbrush-box">
                <h3 className="academy__airbrush-title" style={{ fontFamily: S.serif, color: C.nude }}>
                  {ACADEMY_AIRBRUSH.title}
                </h3>
                <p className="academy__airbrush-intro" style={{ fontFamily: S.sans, color: 'rgba(255,255,255,0.45)' }}>
                  {ACADEMY_AIRBRUSH.intro}
                </p>
                <p className="academy__airbrush-how" style={{ fontFamily: S.sans, color: C.nude }}>
                  {ACADEMY_AIRBRUSH.howTitle}
                </p>
                <p className="academy__airbrush-body" style={{ fontFamily: S.sans, color: 'rgba(255,255,255,0.38)' }}>
                  {ACADEMY_AIRBRUSH.howBody}
                </p>
              </div>
            )}

            <div data-academy-reveal className="academy__cta-wrap">
              <a
                href={getBooksyBookingUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="academy__cta"
                style={{ backgroundColor: C.nude, color: C.espresso, borderColor: C.nude }}
              >
                Umów termin
              </a>
            </div>
          </div>

          {/* Right Side: Image with Parallax Mask */}
          <div
            ref={imgWrapRef}
            className="academy__image-wrap"
            style={imageWrapStyle}
          >
            <img
              ref={imgRef}
              src={ACADEMY_IMAGE}
              alt="Brow Academy — Zostań Ekspertem"
              loading="lazy"
              decoding="async"
              onLoad={onImageReady}
              style={{ objectPosition: ACADEMY_IMAGE_FOCUS }}
            />
            <div className="academy__image-overlay" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Academy;
