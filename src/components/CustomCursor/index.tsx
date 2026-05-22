import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './CustomCursor.css';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Enable only for fine pointers and systems without reduced motion
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnabled(!coarse && !reduced);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const cursor = cursorRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!cursor || !dot || !ring) return;

    // Quicksetters for extreme 60fps performance
    const xDotSetter = gsap.quickSetter(dot, 'x', 'px');
    const yDotSetter = gsap.quickSetter(dot, 'y', 'px');
    const xRingSetter = gsap.quickSetter(ring, 'x', 'px');
    const yRingSetter = gsap.quickSetter(ring, 'y', 'px');

    const mouse = { x: 0, y: 0 };
    const ringPos = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      xDotSetter(mouse.x);
      yDotSetter(mouse.y);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Render loop for lagging ring effect
    const ctx = gsap.context(() => {
      gsap.ticker.add(() => {
        const dt = 1.0 - Math.pow(1.0 - 0.15, gsap.ticker.deltaRatio());
        ringPos.x += (mouse.x - ringPos.x) * dt;
        ringPos.y += (mouse.y - ringPos.y) * dt;
        xRingSetter(ringPos.x);
        yRingSetter(ringPos.y);
      });
    });

    // Hover interactions
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest('a, button, [role="button"], .gallery__item, .gallery-panel, .atelier-panel');
      if (interactive) {
        cursor.classList.add('is-hovering');

        // Check if there is specific custom text for the cursor
        const cursorText = interactive.getAttribute('data-cursor-text');
        if (cursorText) {
          setText(cursorText);
          cursor.classList.add('has-text');
        } else if (interactive.classList.contains('gallery__item')) {
          setText('POWIĘKSZ');
          cursor.classList.add('has-text');
        } else if (interactive.classList.contains('atelier-panel')) {
          setText('ZOBACZ');
          cursor.classList.add('has-text');
        } else if (interactive.getAttribute('href')?.startsWith('http') || interactive.id === 'reviews-submit') {
          setText('KLIK');
          cursor.classList.add('has-text');
        }
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest('a, button, [role="button"], .gallery__item, .gallery-panel, .atelier-panel');
      if (interactive) {
        cursor.classList.remove('is-hovering', 'has-text');
        setText('');
      }
    };

    window.addEventListener('mouseover', onMouseOver, { passive: true });
    window.addEventListener('mouseout', onMouseOut, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mouseout', onMouseOut);
      ctx.revert();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={cursorRef} className="custom-cursor-container" aria-hidden="true">
      <div ref={dotRef} className="custom-cursor__dot" />
      <div ref={ringRef} className="custom-cursor__ring">
        <span className="custom-cursor__text">{text}</span>
      </div>
    </div>
  );
};

export default CustomCursor;
