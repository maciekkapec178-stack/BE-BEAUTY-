import React, { useEffect, useRef, useState } from 'react';
import { galleryImages } from '../../lib/site-content';
import { galleryDefaultSrc, galleryLightboxSrc, galleryLightboxWebp } from '../../lib/gallery-media';
import { getLenis } from '../../lib/scroll-controller';
import { scheduleScrollTriggerRefresh } from '../../lib/scroll-sync';
import { initGalleryAnimations } from './animations';
import './Gallery.css';

const EDITORIAL_TAGS = [
  'Precyzja',
  'Harmonia',
  'Detal',
  'Estetyka',
  'Blask',
  'Klasyka',
  'Kunszt',
  'Inspiracja',
  'Elegancja',
  'Klarowność',
];

interface GalleryProps {
  ready?: boolean;
}

const Gallery: React.FC<GalleryProps> = ({ ready = true }) => {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<ReturnType<typeof initGalleryAnimations> | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [lightbox]);

  useEffect(() => {
    if (!ready) return;

    const pin = pinRef.current;
    const track = trackRef.current;
    if (!pin || !track) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.matchMedia('(min-width: 900px)').matches;

    if (prefersReduced || !isDesktop) return;

    const setup = () => {
      ctxRef.current?.revert();
      ctxRef.current = initGalleryAnimations(pin, track, progressBarRef.current);
      getLenis()?.resize();
      scheduleScrollTriggerRefresh(200);
    };

    const rafId = requestAnimationFrame(setup);

    const imgs = track.querySelectorAll<HTMLImageElement>('img');
    let pending = imgs.length;
    const onImgReady = () => {
      pending -= 1;
      if (pending <= 0) scheduleScrollTriggerRefresh(150);
    };
    imgs.forEach((img) => {
      if (img.complete) onImgReady();
      else {
        img.addEventListener('load', onImgReady, { once: true });
        img.addEventListener('error', onImgReady, { once: true });
      }
    });

    const onResize = () => scheduleScrollTriggerRefresh(250);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, [ready]);

  if (galleryImages.length === 0) return null;

  return (
    <section id="galeria" className="gallery-section">
      <div className="gallery__intro">
        <p className="gallery__eyebrow">Portfolio</p>
        <h2 className="gallery__title">
          Sztuka <em>Kreacji</em>
        </h2>
      </div>

      <div ref={pinRef} className="gallery__pin">
        <div className="gallery__hud desktop-only">
          <span className="gallery__counter">
            GALERIA / {String(galleryImages.length).padStart(2, '0')}
          </span>
          <div className="gallery__progress-container">
            <div ref={progressBarRef} className="gallery__progress-bar" />
          </div>
        </div>

        <div className="gallery__track-container">
          <div ref={trackRef} className="gallery__track">
            {galleryImages.map((src, i) => {
              const isWide = i % 3 === 0;
              const tag = EDITORIAL_TAGS[i % EDITORIAL_TAGS.length];
              const no = String(i + 1).padStart(2, '0');

              return (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  className={`gallery-panel ${isWide ? 'gallery-panel--wide' : ''}`}
                  onClick={() => setLightbox(src)}
                  data-cursor-text="ZOBACZ"
                >
                  <div className="gallery-panel__media-wrap">
                    <img
                      className="gallery-panel__media"
                      src={galleryDefaultSrc(src)}
                      alt={`Portfolio Be Beauty - ${tag}`}
                      loading={i < 2 ? 'eager' : 'lazy'}
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                  <div className="gallery-panel__info">
                    <span className="gallery-panel__no">{no}</span>
                    <span className="gallery-panel__tag">{tag}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        role="dialog"
        aria-modal
        className={`gallery__lightbox ${lightbox ? 'is-open' : ''}`}
        onClick={() => setLightbox(null)}
      >
        <button
          type="button"
          className="gallery__lightbox-close"
          onClick={() => setLightbox(null)}
          aria-label="Zamknij"
        >
          ✕
        </button>
        <div className="gallery__lightbox-img-wrap" onClick={(e) => e.stopPropagation()}>
          {lightbox && (
            <picture>
              <source type="image/webp" srcSet={galleryLightboxWebp(lightbox)} />
              <img src={galleryLightboxSrc(lightbox)} alt="Powiększenie" />
            </picture>
          )}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
