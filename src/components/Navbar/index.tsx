import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { C, S } from '../../theme';
import { getBooksyBookingUrl } from '../../lib/site-content';
import { onScrollY, scrollToAnchor, setScrollLocked } from '../../lib/scroll-controller';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Atelier', href: '#atelier' },
  { label: 'Galeria', href: '#galeria' },
  { label: 'Cennik', href: '#cennik' },
  { label: 'Opinie', href: '#opinie' },
  { label: 'Academy', href: '#academy' },
  { label: 'O Nas', href: '#o-nas' },
] as const;

const Navbar: React.FC = () => {
  const navRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const flags = useRef({ scrolled: false, hidden: false });

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);

  const handleMobileNav = useCallback(
    (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!href.startsWith('#')) return;
      e.preventDefault();
      closeMenu();
      const target = href.slice(1);
      window.requestAnimationFrame(() => scrollToAnchor(target));
    },
    [closeMenu],
  );

  // Floating scroll-hide mechanism
  useEffect(() => {
    const TOP_SHOW = 80;
    const DELTA_MIN = 10;
    const nav = navRef.current;
    if (!nav) return;

    // Intro stagger for Navbar elements on mount
    const ctx = gsap.context(() => {
      gsap.fromTo('.site-nav__inner > *', 
        { y: -20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', stagger: 0.1, delay: 0.5 }
      );
    });

    const apply = (scrolled: boolean, hidden: boolean) => {
      nav.classList.toggle('site-nav--scrolled', scrolled);
      nav.classList.toggle('site-nav--hidden', hidden);
      flags.current.scrolled = scrolled;
      flags.current.hidden = hidden;
    };

    const unsubscribe = onScrollY((y) => {
      const scrolled = y > 60;
      if (flags.current.scrolled !== scrolled) {
        apply(scrolled, flags.current.hidden);
      }

      if (menuOpen) {
        if (flags.current.hidden) apply(scrolled, false);
        lastY.current = y;
        return;
      }

      const delta = y - lastY.current;
      lastY.current = y;

      let hidden = flags.current.hidden;
      if (y <= TOP_SHOW) {
        hidden = false;
      } else if (delta > DELTA_MIN) {
        hidden = true;
      } else if (delta < -DELTA_MIN) {
        hidden = false;
      }

      if (flags.current.hidden !== hidden) {
        apply(scrolled, hidden);
      }
    });

    return () => {
      unsubscribe();
      ctx.revert();
    };
  }, [menuOpen]);

  // Escape, resize → desktop, cleanup scroll lock
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    const desktopMq = window.matchMedia('(min-width: 992px)');
    const onDesktop = () => {
      if (desktopMq.matches) closeMenu();
    };

    window.addEventListener('keydown', onKeyDown);
    desktopMq.addEventListener('change', onDesktop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      desktopMq.removeEventListener('change', onDesktop);
    };
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (menuOpen) {
      document.documentElement.classList.add('nav-menu-open');
      setScrollLocked(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.classList.remove('nav-menu-open');
      document.body.style.overflow = '';
      setScrollLocked(false);
    }

    return () => {
      document.documentElement.classList.remove('nav-menu-open');
      document.body.style.overflow = '';
      setScrollLocked(false);
    };
  }, [menuOpen]);

  // Mobile menu overlay GSAP stagger anim
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const ctx = gsap.context(() => {
      if (menuOpen) {
        gsap.to(overlay, { clipPath: 'circle(150% at 90% 10%)', duration: 0.85, ease: 'power4.inOut' });
        gsap.fromTo(
          '.mobile-overlay__link',
          { y: 40, opacity: 0, rotate: 3 },
          { y: 0, opacity: 1, rotate: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.25 },
        );
      } else {
        gsap.to(overlay, { clipPath: 'circle(0% at 90% 10%)', duration: 0.7, ease: 'power4.inOut' });
      }
    }, overlay);

    return () => ctx.revert();
  }, [menuOpen]);

  return (
    <>
      <header ref={navRef} className="site-nav">
        <div className="site-nav__inner" style={{ fontFamily: S.sans }}>
          {/* Logo */}
          <a
            href="/"
            className="site-nav__logo"
            style={{ fontFamily: S.serif }}
            onClick={() => menuOpen && closeMenu()}
          >
            BE BEAUTY
          </a>

          {/* Desktop Navigation links */}
          <nav className="site-nav__desktop" aria-label="Główna">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={href} href={href} className="site-nav__link">
                {label}
              </a>
            ))}
          </nav>

          {/* Right Action buttons */}
          <div className="site-nav__actions">
            <a href="#kontakt" className="site-nav__link desktop-only-link">
              Kontakt
            </a>
            <a
              href={getBooksyBookingUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="site-nav__cta"
              style={{ backgroundColor: C.nude, color: C.espresso }}
            >
              Rezerwacja
            </a>

            {/* Hamburger Trigger */}
            <button
              type="button"
              onClick={toggleMenu}
              className="site-nav__hamburger"
              aria-label={menuOpen ? 'Zamknij menu' : 'Otwórz menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <div className={`hamburger-box ${menuOpen ? 'is-active' : ''}`}>
                <span className="hamburger-line" />
                <span className="hamburger-line" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        ref={overlayRef}
        id="mobile-menu"
        className={`mobile-overlay${menuOpen ? ' mobile-overlay--open' : ''}`}
        aria-hidden={!menuOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeMenu();
        }}
      >
        <button
          type="button"
          className="mobile-overlay__close"
          aria-label="Zamknij menu"
          onClick={closeMenu}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>

        <div className="mobile-overlay__inner">
          <nav className="mobile-overlay__nav" aria-label="Menu mobilne">
            {[...NAV_LINKS, { label: 'Kontakt', href: '#kontakt' }].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={handleMobileNav(href)}
                className="mobile-overlay__link"
                style={{ fontFamily: S.serif }}
                tabIndex={menuOpen ? 0 : -1}
              >
                {label}
              </a>
            ))}
            <a
              href={getBooksyBookingUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-overlay__booksy"
              style={{ fontFamily: S.sans, backgroundColor: C.nude, color: C.espresso }}
              onClick={closeMenu}
              tabIndex={menuOpen ? 0 : -1}
            >
              Rezerwacja
            </a>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Navbar;
