import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { C, S } from '../../theme';
import { scrollToTop } from '../../lib/scroll';
import { ensureScrollUnlocked, getLenis, setScrollLocked } from '../../lib/scroll-controller';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './PrestigeLoading.css';

interface PrestigeLoadingProps {
  onDone: () => void;
}

const PrestigeLoading: React.FC<PrestigeLoadingProps> = ({ onDone }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);


  useEffect(() => {
    scrollToTop();
    const lock = () => {
      if (getLenis()) setScrollLocked(true);
      else requestAnimationFrame(lock);
    };
    lock();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Split text letters for premium intro reveal
    const letters = titleRef.current?.querySelectorAll('.preloader__char');
    const subtitle = subtitleRef.current;

    const state = { value: 0 };
    let lastPct = -1;

    const tl = gsap.timeline({
      onComplete: () => {
        // Trigger multi-panel slide out
        const panels = container.querySelectorAll('.preloader__panel');
        const content = container.querySelector('.preloader__content');

        const outTl = gsap.timeline({
          onComplete: () => {
            scrollToTop();
            container.style.pointerEvents = 'none';
            container.style.visibility = 'hidden';
            ensureScrollUnlocked();
            onDoneRef.current();

            requestAnimationFrame(() => {
              getLenis()?.resize();
              ScrollTrigger.refresh();
              getLenis()?.scrollTo(0, { immediate: true });
              window.setTimeout(() => ScrollTrigger.refresh(), 500);
            });
          }
        });

        outTl.to(content, { opacity: 0, y: -40, duration: 0.6, ease: 'power3.in' })
          .to(panels, {
            yPercent: -100,
            duration: 1.2,
            stagger: 0.12,
            ease: 'power4.inOut',
          }, '-=0.3');
      }
    });

    // 1. Initial letters stagger
    if (letters) {
      tl.set(letters, { y: 60, opacity: 0 })
        .to(letters, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.05,
          ease: 'power3.out'
        });
    }

    if (subtitle) {
      tl.fromTo(subtitle, { opacity: 0, y: 15 }, { opacity: 0.4, y: 0, duration: 0.6 }, '-=0.4');
    }

    // 2. Loading progress
    tl.to(state, {
      value: 100,
      duration: 2.2,
      ease: 'power3.inOut',
      onUpdate: () => {
        const v = Math.round(state.value);
        if (v === lastPct) return;
        lastPct = v;
        if (barRef.current) barRef.current.style.width = `${v}%`;
        if (pctRef.current) pctRef.current.textContent = String(v);
      }
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="preloader-container">
      {/* 3 panels for premium shutter transition */}
      <div className="preloader__panel panel-1" />
      <div className="preloader__panel panel-2" />
      <div className="preloader__panel panel-3" />

      <div className="preloader__content">
        {/* Brand Title */}
        <div className="preloader__brand">
          <div ref={titleRef} className="preloader__title" style={{ fontFamily: S.serif }}>
            {Array.from("BE BEAUTY").map((char, index) => (
              <span key={index} className="preloader__char" style={{ display: char === ' ' ? 'inline-block' : 'inline-flex', width: char === ' ' ? '0.25em' : 'auto' }}>
                {char}
              </span>
            ))}
          </div>
          <div ref={subtitleRef} className="preloader__subtitle" style={{ fontFamily: S.sans }}>
            Gdzie nauka spotyka piękno
          </div>
        </div>

        {/* Loading Progress Bar */}
        <div className="preloader__progress-wrap">
          <div className="preloader__bar-container">
            <div ref={barRef} className="preloader__bar" style={{ backgroundColor: C.nude }} />
            <div className="preloader__bar-shimmer" />
          </div>
          <div className="preloader__status">
            <span className="preloader__status-label" style={{ fontFamily: S.sans }}>Inicjalizacja</span>
            <span className="preloader__status-pct" style={{ fontFamily: S.serif, color: C.nude }}>
              <span ref={pctRef}>0</span>
              <span className="preloader__pct-sym">%</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrestigeLoading;
