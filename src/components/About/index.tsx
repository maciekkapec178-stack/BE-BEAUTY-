import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { C, S } from '../../theme';
import { site, normalizeDescription } from '../../lib/site-content';
import './About.css';

gsap.registerPlugin(ScrollTrigger);

const ABOUT_SECTION_IMAGE = '/images/social/logo-02.jpg';

const About: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const imgInnerRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // 1. Image Parallax Reveal
      const img = imgRef.current;
      const imgInner = imgInnerRef.current;
      if (img && imgInner) {
        gsap.fromTo(img, 
          { clipPath: 'inset(100% 0% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.6,
            ease: 'power4.inOut',
            scrollTrigger: {
              trigger: img,
              start: 'top 80%',
            }
          }
        );

        gsap.fromTo(imgInner,
          { scale: 1.25, yPercent: 12 },
          {
            scale: 1,
            yPercent: 0,
            duration: 1.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: img,
              start: 'top 80%',
            }
          }
        );

        // Continuous parallax scroll on image
        gsap.to(imgInner, {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: img,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      // 2. Text Reveal animations
      const lines = titleRef.current?.querySelectorAll('.about__title-line-inner');
      if (lines?.length) {
        gsap.fromTo(lines, 
          { yPercent: 120, rotate: 3, opacity: 0 },
          {
            yPercent: 0,
            rotate: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.15,
            scrollTrigger: {
              trigger: titleRef.current,
              start: 'top 78%',
            }
          }
        );
      }

      if (descRef.current) {
        gsap.fromTo(descRef.current,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: descRef.current,
              start: 'top 82%',
            }
          }
        );
      }

      // 3. Stats stagger reveal
      const statItems = statsRef.current?.querySelectorAll('.about__stat-item');
      if (statItems?.length) {
        gsap.fromTo(statItems,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: statsRef.current,
              start: 'top 85%',
            }
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="o-nas" className="about-section">
      <div className="about-section__inner">
        <div className="about-section__grid">
          {/* Left Column: Image wrapper */}
          <div ref={imgRef} className="about__image-wrap">
            <img
              ref={imgInnerRef}
              src={ABOUT_SECTION_IMAGE}
              alt={site.brand.owner}
              loading="lazy"
              decoding="async"
            />
            <div className="about__image-border" />
          </div>

          {/* Right Column: Text content */}
          <div className="about__content">
            <p className="about__eyebrow" style={{ fontFamily: S.sans }}>
              O NAS
            </p>
            <h2 ref={titleRef} className="about__title" style={{ fontFamily: S.serif }}>
              <span className="about__title-line">
                <span className="about__title-line-inner">Symetria</span>
              </span>
              <br />
              <span className="about__title-line about__title-line--accent">
                <span className="about__title-line-inner" style={{ color: C.nude }}>
                  Precyzji
                </span>
              </span>
            </h2>
            <p ref={descRef} className="about__desc" style={{ fontFamily: S.sans, color: C.textMuted }}>
              {normalizeDescription()}
            </p>

            {/* Stats block */}
            <div ref={statsRef} className="about__stats">
              {site.stats.map(({ value, label }) => (
                <div key={label} className="about__stat-item">
                  <span className="about__stat-val" style={{ fontFamily: S.serif, color: C.brown }}>
                    {value}
                  </span>
                  <span className="about__stat-lbl" style={{ fontFamily: S.sans, color: C.nude }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
