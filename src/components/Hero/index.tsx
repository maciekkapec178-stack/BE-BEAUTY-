import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { C, S } from '../../theme';
import { site, getBooksyBookingUrl } from '../../lib/site-content';
import { EASE } from '../../lib/gsap-motion';
import './Hero.css';

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  ready: boolean;
}

const Hero: React.FC<HeroProps> = ({ ready }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;

    const section = sectionRef.current;
    if (!section) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    // Intro Entrance Timeline
    const ctx = gsap.context(() => {
      // Split Title & Subtitle for animation
      const titleChars = titleRef.current?.querySelectorAll('.hero__char');
      
      const tl = gsap.timeline({ delay: 0.1 });
      
      if (isMobile) {
        gsap.set('.hero__bg-wrapper', { scale: 1, clipPath: 'inset(0% 0% 0% 0%)' });
      } else {
        gsap.set('.hero__bg-wrapper', { scale: 1.15, clipPath: 'inset(10% 10% 10% 10%)' });
      }
      gsap.set('.hero__content-side > *', { opacity: 0, y: 30 });

      tl.to('.hero__bg-wrapper', {
        clipPath: 'inset(0% 0% 0% 0%)',
        scale: isMobile ? 1 : 1.05,
        duration: isMobile ? 1.4 : 2.2,
        ease: EASE.reveal,
      })
      .to('.hero__content-side > *', {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.1
      }, '-=1.2');

      // Title characters stagger reveal
      if (titleChars?.length) {
        tl.fromTo(titleChars, 
          { yPercent: 100, rotate: 3, opacity: 0 },
          { yPercent: 0, rotate: 0, opacity: 1, duration: 1.4, ease: 'expo.out', stagger: 0.04 },
          '-=1.4'
        );
      }

      if (prefersReduced) return;

      // Scroll-driven Parallax and Tilt exit
      const exitTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        }
      });

      exitTl
        .to(
          bgRef.current,
          { yPercent: isMobile ? 6 : 18, scale: isMobile ? 1.02 : 1.12, ease: 'none' },
          0,
        )
        .to(containerRef.current, {
          yPercent: isMobile ? 18 : 35,
          scale: isMobile ? 0.98 : 0.94,
          opacity: 0,
          transformOrigin: 'center bottom',
          ease: 'power2.in'
        }, 0);
    });

    // Elegant Mouse Hover Parallax for Hero (desktop)
    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReduced || isMobile || isCoarsePointer) return;
      const { clientX, clientY } = e;
      const xNorm = (clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const yNorm = (clientY / window.innerHeight - 0.5) * 2;

      gsap.to('.hero__bg-wrapper img', {
        x: xNorm * 18,
        y: yNorm * 18,
        duration: 1.5,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      ctx.revert();
    };
  }, [ready]);

  return (
    <section id="hero" ref={sectionRef} className="hero">
      {/* Background Image Container */}
      <div ref={bgRef} className="hero__bg">
        <div className="hero__bg-wrapper">
          <picture>
            <source
              media="(max-width: 768px)"
              srcSet={`/images/social/hero-fb-photo.webp?v=20260521d 768w, /images/social/hero-fb-photo@2x.webp?v=20260521d 1536w`}
              sizes="100vw"
              type="image/webp"
            />
            <source
              srcSet={`/images/social/hero-fb-photo.webp?v=20260521d 960w, /images/social/hero-fb-photo@2x.webp?v=20260521d 1920w`}
              sizes="100vw"
              type="image/webp"
            />
            <source
              media="(max-width: 768px)"
              srcSet={`${site.images.hero}?v=20260521d 768w, /images/social/hero-fb-photo@2x.jpg?v=20260521d 1536w`}
              sizes="100vw"
              type="image/jpeg"
            />
            <source
              srcSet={`${site.images.hero}?v=20260521d 960w, /images/social/hero-fb-photo@2x.jpg?v=20260521d 1920w`}
              sizes="100vw"
              type="image/jpeg"
            />
            <img
              src={`${site.images.hero}?v=20260521d`}
              alt="Be Beauty - Małgorzata Szymajda"
              loading="eager"
              decoding="async"
            />
          </picture>
        </div>
        <div className="hero__gradient-overlay" />
      </div>

      {/* Main Content grid */}
      <div ref={containerRef} className="hero__container">
        <div className="hero__content-side">
          <p ref={textRef} className="hero__eyebrow" style={{ fontFamily: S.sans }}>
            Luksusowa Pielęgnacja &amp; Edukacja
          </p>

          <h1 ref={titleRef} className="hero__title" style={{ fontFamily: S.serif }}>
            {Array.from("BE BEAUTY").map((char, index) => (
              <span key={index} className="hero__char" style={{ display: char === ' ' ? 'inline-block' : 'inline-flex', width: char === ' ' ? '0.25em' : 'auto' }}>
                {char}
              </span>
            ))}
          </h1>

          <div ref={lineRef} className="hero__divider" />

          <p ref={descRef} className="hero__desc" style={{ fontFamily: S.accent }}>
            Synonim absolutnej perfekcji w geometrii spojrzenia i nowoczesnej kosmetyce twarzy.
          </p>

          <div ref={ctaRef} className="hero__cta-wrapper">
            <a
              href={getBooksyBookingUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hero__cta"
              style={{ backgroundColor: C.nude, color: C.espresso }}
            >
              Zarezerwuj Wizytę
            </a>
          </div>
        </div>
      </div>

      {/* Decorative vertical texts */}
      <div className="hero__side-decor" style={{ fontFamily: S.sans }}>
        <span>Brow Academy — Be Beauty</span>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll-indicator">
        <span className="hero__scroll-line" />
      </div>
    </section>
  );
};

export default Hero;
