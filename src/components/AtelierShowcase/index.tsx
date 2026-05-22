import React, { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { C, S } from '../../theme';
import { site } from '../../lib/site-content';
import { getAtelierFrame } from '../../lib/atelier-images';
import { getLenis } from '../../lib/scroll-controller';
import { scheduleScrollTriggerRefresh } from '../../lib/scroll-sync';
import { initAtelierAnimations } from './animations';
import { AtelierPanel, PanelDef, AtelierServiceData } from './AtelierPanel';
import './AtelierShowcase.css';

const ATELIER_SERVICES = [
  { id: 'brows', no: '01', layout: 'cinema' as const, img: '/images/social/ig-8-11.jpg' },
  { id: 'pmu-lips', no: '02', layout: 'cinema' as const, img: '/images/social/booksy-05.jpg' },
  { id: 'cosmetology', no: '03', layout: 'portrait' as const, img: '/images/social/booksy-03.jpg' },
  { id: 'nails', no: '04', layout: 'portrait' as const, img: '/images/social/atelier-nails-04.png' },
];

const AtelierShowcase: React.FC<{ ready?: boolean }> = ({ ready = true }) => {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  const panelsData = useMemo<PanelDef[]>(() => {
    const siteById = new Map(site.atelier.map((item) => [item.id, item]));

    const generatedPanels: PanelDef[] = ATELIER_SERVICES.flatMap((svc) => {
      const item = siteById.get(svc.id);
      const data: AtelierServiceData | undefined = item
        ? {
            id: svc.id,
            title: item.title,
            tag: item.tag,
            desc: item.description,
            img: svc.img,
            frame: getAtelierFrame(svc.id, svc.layout, item.imageFocus),
          }
        : undefined;

      return [
        { type: 'divider', id: svc.id, no: svc.no, data },
        { type: 'service', id: svc.id, no: svc.no, layout: svc.layout, data },
      ];
    });

    generatedPanels.push({
      type: 'cta',
      rating: site.booksy.rating
        ? { value: String(site.booksy.rating.value), count: String(site.booksy.rating.count) }
        : undefined,
    });

    return generatedPanels;
  }, []);

  const totalNumbered = ATELIER_SERVICES.length;

  useEffect(() => {
    if (!ready) return;

    const pin = pinRef.current;
    const track = trackRef.current;
    const progressBar = progressRef.current;
    if (!pin || !track) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desktopMq = window.matchMedia('(min-width: 900px)');

    let mobileObserver: IntersectionObserver | null = null;
    let rafId = 0;

    const teardownDesktop = () => {
      ctxRef.current?.revert();
      ctxRef.current = null;
      ScrollTrigger.getById('atelier-horizontal')?.kill();
      gsap.set(track, { clearProps: 'transform,x' });
    };

    const setupMobile = () => {
      teardownDesktop();
      const panels = track.querySelectorAll('.atelier-panel');
      mobileObserver?.disconnect();
      mobileObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle('is-inview', entry.isIntersecting);
          });
        },
        { threshold: 0.2, rootMargin: '0px 0px -6% 0px' },
      );
      panels.forEach((panel) => mobileObserver?.observe(panel));
      getLenis()?.resize();
      scheduleScrollTriggerRefresh(200);
    };

    const setupDesktop = () => {
      mobileObserver?.disconnect();
      mobileObserver = null;
      if (prefersReduced) {
        teardownDesktop();
        return;
      }
      teardownDesktop();
      rafId = requestAnimationFrame(() => {
        ctxRef.current = initAtelierAnimations(pin, track, progressBar);
        getLenis()?.resize();
        scheduleScrollTriggerRefresh(200);
      });
    };

    const applyMode = () => {
      if (desktopMq.matches) setupDesktop();
      else setupMobile();
    };

    applyMode();
    desktopMq.addEventListener('change', applyMode);
    const handleResize = () => scheduleScrollTriggerRefresh(250);
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      desktopMq.removeEventListener('change', applyMode);
      window.removeEventListener('resize', handleResize);
      mobileObserver?.disconnect();
      teardownDesktop();
    };
  }, [ready]);

  return (
    <section id="atelier" className="atelier">
      <div className="atelier__intro">
        <p className="atelier__eyebrow" style={{ fontFamily: S.sans, color: C.nude }}>Nasze Atelier</p>
        <h2 className="atelier__title" style={{ fontFamily: S.serif }}>
          Cztery światy <em>piękna</em>
        </h2>
      </div>

      <div ref={pinRef} className="atelier__pin">
        <div className="atelier__hud desktop-only">
          <span className="atelier__counter" style={{ fontFamily: S.sans }}>
            EXPLORE / {String(totalNumbered).padStart(2, '0')}
          </span>
          <div className="atelier__progress">
            <div ref={progressRef} className="atelier__progress-bar" />
          </div>
        </div>

        <div className="atelier__track-container">
          <div ref={trackRef} className="atelier__track">
            {panelsData.map((panel, idx) => (
              <AtelierPanel key={`panel-${panel.type}-${panel.type === 'cta' ? idx : panel.id}-${idx}`} panel={panel} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AtelierShowcase;
