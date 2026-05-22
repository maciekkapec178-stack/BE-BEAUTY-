import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { C, S } from '../../theme';
import {
  site,
  formatOpeningHours,
  getBooksyBookingUrl,
  getGoogleMapsDirectionsUrl,
  FACEBOOK_URL,
  INSTAGRAM_URL,
} from '../../lib/site-content';
import FooterMapEmbed from '../FooterMapEmbed';
import './Footer.css';

gsap.registerPlugin(ScrollTrigger);

const IconInstagram: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
  </svg>
);

const IconFacebook: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M14 8.5h2.5V5h-2.2c-2.5 0-3.8 1.5-3.8 4.2V11H8v3.5h2.5V22h3.8v-7.5H18l.5-3.5h-3.2v-2.2c0-1 .3-1.8 1.8-1.8z" />
  </svg>
);

const Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const line = lineRef.current;
    const main = mainRef.current;
    if (!line || !main) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // 1. Reveal line scaling horizontally
      gsap.fromTo(line, 
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: 1,
          duration: 1.4,
          ease: 'power3.inOut',
          scrollTrigger: {
            trigger: main,
            start: 'top 95%',
          }
        }
      );

      // 2. Stagger text fields
      const footerTexts = main.querySelectorAll('[data-footer-reveal]');
      if (footerTexts.length) {
        gsap.fromTo(footerTexts,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: main,
              start: 'top 88%',
            }
          }
        );
      }

      // 3. Stagger bottom elements
      const bottomElems = bottomRef.current?.children;
      if (bottomElems?.length) {
        gsap.fromTo(bottomElems,
          { y: 15, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.06,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: bottomRef.current,
              start: 'top 95%',
            }
          }
        );
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const hours = formatOpeningHours();
  const displayedHours = hours.length 
    ? hours.map(({ day, hours }) => [day, hours] as [string, string])
    : [['Pon – Pt', '9:00 – 19:00'], ['Sobota', '9:00 – 14:00'], ['Niedziela', 'Zamknięte']];

  return (
    <footer ref={footerRef} id="kontakt" className="site-footer">
      <div ref={lineRef} className="footer__divider-line" />
      
      <div className="footer__inner">
        <div ref={mainRef} className="footer__grid">
          {/* Brand Info */}
          <div data-footer-reveal className="footer__brand-col">
            <h2 className="footer__logo" style={{ fontFamily: S.serif }}>BE BEAUTY</h2>
            <p className="footer__brand-desc" style={{ fontFamily: S.sans }}>
              Połączenie eksperckiej wiedzy z zakresu stylizacji brwi oraz subtelnej pielęgnacji, która podkreśla to, co w Tobie najpiękniejsze.
            </p>
            <p className="footer__brand-italic" style={{ fontFamily: S.accent, color: 'rgba(196,168,130,0.5)' }}>
              Synonim absolutnej perfekcji w geometrii spojrzenia i nowoczesnej kosmetyce twarzy.
            </p>
            
            {/* Social Links */}
            <div className="footer__socials">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer__social-link">
                <IconInstagram />
              </a>
              <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="footer__social-link">
                <IconFacebook />
              </a>
            </div>
          </div>

          {/* Contact Details */}
          <div data-footer-reveal className="footer__contact-col">
            <h3 className="footer__subtitle" style={{ fontFamily: S.sans, color: C.nude }}>Kontakt</h3>
            <p className="footer__legal-name" style={{ fontFamily: S.sans }}>{site.brand.legalName}</p>
            <p className="footer__address" style={{ fontFamily: S.sans }}>{site.contact.address.full}</p>
            
            <p className="footer__phone" style={{ fontFamily: S.sans }}>
              Telefon:{' '}
              <a href={`tel:${site.contact.phone.replace(/\s/g, '')}`} style={{ fontFamily: S.accent }}>
                570 520 195
              </a>
            </p>
            
            <a href={`mailto:${site.contact.email}`} className="footer__email" style={{ fontFamily: S.accent }}>
              {site.contact.email}
            </a>

            <a
              href={getBooksyBookingUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__booksy-cta"
              style={{ fontFamily: S.sans, color: C.nude, borderColor: 'rgba(196,168,130,0.3)' }}
            >
              Zarezerwuj na Booksy
            </a>
          </div>

          {/* Opening Hours */}
          <div data-footer-reveal className="footer__hours-col">
            <h3 className="footer__subtitle" style={{ fontFamily: S.sans, color: C.nude }}>Godziny Przyjęć</h3>
            <div className="footer__hours-list">
              {displayedHours.map(([d, h]) => (
                <div key={d} className="footer__hours-row" style={{ fontFamily: S.sans }}>
                  <span className="footer__hours-day">{d}</span>
                  <span className="footer__hours-val">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map Embed */}
          <div data-footer-reveal className="footer__map-col">
            <div className="footer__map-header">
              <h3 className="footer__subtitle" style={{ fontFamily: S.sans, color: C.nude }}>Dojazd</h3>
              <a href={getGoogleMapsDirectionsUrl()} target="_blank" rel="noopener noreferrer" className="footer__nav-link" style={{ fontFamily: S.sans }}>
                Nawiguj →
              </a>
            </div>
            <div className="footer__map-container">
              <FooterMapEmbed />
            </div>
          </div>
        </div>

        {/* Footer Bottom copyright */}
        <div ref={bottomRef} className="footer__bottom" style={{ fontFamily: S.sans }}>
          <p className="footer__copy">
            © 2025 BE BEAUTY. Wszelkie prawa zastrzeżone.
          </p>
          <div className="footer__legal-links">
            <a href="#" className="footer__legal-link">Polityka Prywatności</a>
            <a href="#" className="footer__legal-link">Regulamin</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
