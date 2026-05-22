import React, { useEffect, useRef, useState } from 'react';
import { GOOGLE_MAPS_EMBED_URL } from '../lib/site-content';
import { getLenis } from '../lib/scroll-controller';
import { scheduleScrollTriggerRefresh } from '../lib/scroll-sync';

/**
 * Mapa Google — montowana raz, dopiero gdy footer wchodzi w viewport.
 * Bez tego iframe ładuje się od razu i wyzwala lawinę layout + ScrollTrigger.refresh.
 */
const FooterMapEmbed: React.FC = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShowMap(true);
          io.disconnect();
        }
      },
      { rootMargin: '160px 0px', threshold: 0 },
    );

    io.observe(host);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!showMap) return;
    const t = window.setTimeout(() => {
      getLenis()?.resize();
      scheduleScrollTriggerRefresh(350);
    }, 350);
    return () => window.clearTimeout(t);
  }, [showMap]);

  return (
    <div
      ref={hostRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid rgba(196,168,130,0.15)',
        lineHeight: 0,
        minHeight: 'clamp(200px, 42vw, 260px)',
        height: 'clamp(200px, 42vw, 260px)',
        contain: 'layout paint',
        background: 'rgba(0,0,0,0.2)',
      }}
    >
      {showMap ? (
        <iframe
          title="Mapa dojazdu — BE BEAUTY Lubań"
          src={GOOGLE_MAPS_EMBED_URL}
          width="100%"
          height="220"
          style={{
            border: 0,
            display: 'block',
            width: '100%',
            height: '100%',
            minHeight: 'clamp(200px, 42vw, 260px)',
            filter: 'grayscale(25%) contrast(1.05) brightness(0.9)',
          }}
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : null}
    </div>
  );
};

export default FooterMapEmbed;
