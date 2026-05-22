import React from 'react';
import { C, S } from '../../theme';
import { scrollToAnchor } from '../../lib/scroll-controller';
import { getBooksyBookingUrl } from '../../lib/site-content';

export type AtelierServiceData = {
  id: string;
  title: string;
  tag: string;
  desc: string;
  img: string;
  frame: { objectPosition: string };
};

export type PanelDef =
  | { type: 'service'; id: string; no: string; layout: 'cinema' | 'portrait'; data?: AtelierServiceData }
  | { type: 'divider'; id: string; no: string; data?: AtelierServiceData }
  | { type: 'cta'; rating?: { value: string; count: string } };

interface AtelierPanelProps {
  panel: PanelDef;
}

export const AtelierPanel: React.FC<AtelierPanelProps> = React.memo(({ panel }) => {
  if (panel.type === 'divider' && panel.data) {
    return (
      <article className="atelier-panel atelier-panel--divider" onClick={() => scrollToAnchor('cennik')}>
        <div className="atelier-panel__content">
          <span className="atelier-panel__number" style={{ fontFamily: S.serif, color: C.nude }}>{panel.no}</span>
          <p className="atelier-panel__tag" style={{ fontFamily: S.sans, color: C.nude }}>{panel.data.tag}</p>
          <h3 className="atelier-panel__heading" style={{ fontFamily: S.serif, color: 'white' }}>{panel.data.title}</h3>
          <p className="atelier-panel__desc" style={{ fontFamily: S.sans, fontSize: '13px', color: 'rgba(255,255,255,0.5)', maxWidth: '36ch', margin: 0 }}>
            {panel.data.desc}
          </p>
        </div>
      </article>
    );
  }

  if (panel.type === 'cta') {
    return (
      <article className="atelier-panel atelier-panel--cta">
        <div>
          <p className="atelier-panel__tag" style={{ fontFamily: S.sans, color: C.nude }}>BE BEAUTY · LUBAŃ</p>
          <h3 className="atelier-panel__heading" style={{ fontFamily: S.serif, color: 'white' }}>Cennik & rezerwacja</h3>
          {panel.rating && (
            <p style={{ fontFamily: S.sans, fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>
              ★ {panel.rating.value} · {panel.rating.count} opinii Booksy
            </p>
          )}
        </div>
        <button className="atelier-panel__cta-btn" onClick={() => scrollToAnchor('cennik')}>
          Przejdź do cennika ↗
        </button>
        <a 
          href={getBooksyBookingUrl()} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ fontFamily: S.sans, fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', margin: '16px 0 0 0', display: 'block' }}
        >
          Rezerwuj wizytę
        </a>
      </article>
    );
  }

  if (panel.type === 'service' && panel.data) {
    return (
      <article className={`atelier-panel atelier-panel--photo atelier-panel--${panel.layout}`} onClick={() => scrollToAnchor('cennik')}>
        <div className="atelier-panel__media-wrapper">
          <img 
            className="atelier-panel__media" 
            src={panel.data.img} 
            alt={panel.data.title} 
            loading={panel.no === '01' ? 'eager' : 'lazy'}
            decoding="async"
            style={{ objectPosition: panel.data.frame.objectPosition }}
            draggable={false}
          />
          <div className="atelier-panel__overlay" />
        </div>
      </article>
    );
  }

  return null;
});

AtelierPanel.displayName = 'AtelierPanel';
