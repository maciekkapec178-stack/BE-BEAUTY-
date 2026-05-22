import React, { useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { useScrollProgress } from './hooks/useScrollProgress';
import { ensureScrollUnlocked, getLenis } from './lib/scroll-controller';
import { scheduleScrollTriggerRefresh } from './lib/scroll-sync';

// Modular High-End Components
import PrestigeLoading from './components/PrestigeLoading';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AtelierShowcase from './components/AtelierShowcase';
import Gallery from './components/Gallery';
import BooksyPricing from './components/BooksyPricing';
import Reviews from './components/Reviews';
import About from './components/About';
import Academy from './components/Academy';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';

const ScrollProgress: React.FC = () => {
  const barRef = useScrollProgress();
  return (
    <div className="scroll-progress" aria-hidden="true">
      <div ref={barRef} className="scroll-progress__bar" />
    </div>
  );
};

export default function App() {
  const [loaded, setLoaded] = useState(false);
  useSmoothScroll();

  useEffect(() => {
    if (!loaded) return;
    ensureScrollUnlocked();
    const sync = () => {
      getLenis()?.resize();
      ScrollTrigger.refresh();
      scheduleScrollTriggerRefresh(400);
    };
    requestAnimationFrame(sync);
    const fallback = window.setTimeout(ensureScrollUnlocked, 800);
    return () => window.clearTimeout(fallback);
  }, [loaded]);

  return (
    <>
      {/* Dynamic Scroll Progress Indicator */}
      <ScrollProgress />

      {/* Awwwards Custom Floating Cursor */}
      <CustomCursor />

      {/* Premium Staggered Shutter Intro Loader */}
      <PrestigeLoading onDone={() => setLoaded(true)} />

      {/* Main Page Layout Wrapper */}
      <div
        className="app-container"
        style={{
          opacity: loaded ? 1 : 0,
          transition: loaded ? 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          pointerEvents: loaded ? 'auto' : 'none',
        }}
      >
        <Navbar />
        <Hero ready={loaded} />
        <div className="page-gradient-flow">
          <AtelierShowcase ready={loaded} />
          <Gallery ready={loaded} />
          <BooksyPricing />
          <Reviews />
          <About />
          <Academy />
          <Footer />
        </div>
      </div>
    </>
  );
}
