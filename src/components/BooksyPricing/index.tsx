import React, { useMemo, useState } from 'react';
import { scrollToAnchor } from '../../lib/scroll-controller';
import { C, S } from '../../theme';
import {
  amenities,
  business,
  catalogCategories,
  formatDuration,
  formatPrice,
  popularServices,
  type BooksyService,
} from '../../lib/booksy';
import { BOOKSY_URL, decodeHtmlEntities, getBooksyBookingUrl } from '../../lib/site-content';
import './BooksyPricing.css';

const BooksyPricing: React.FC = () => {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [query, setQuery] = useState('');

  const filteredServices = useMemo(() => {
    const pool =
      activeCategory === 'all'
        ? catalogCategories.flatMap((c) => c.services)
        : catalogCategories.find((c) => c.name === activeCategory)?.services ?? [];

    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false),
    );
  }, [activeCategory, query]);

  const totalCount = catalogCategories.reduce((n, c) => n + c.serviceCount, 0);

  const openCatalog = (category?: string) => {
    if (category) setActiveCategory(category);
    setCatalogOpen(true);
    requestAnimationFrame(() => {
      scrollToAnchor('cennik-pelny');
    });
  };

  return (
    <section id="cennik" className="booksy-section">
      <div className="booksy-container">
        <div className="booksy__header">
          <div>
            <p className="booksy__eyebrow">
              Booksy · {totalCount} usług
            </p>
            <h2 className="booksy__title">
              Cennik &<br />
              <em>Rezerwacja</em>
            </h2>
            {business.rating && (
              <div className="booksy__rating">
                <span className="booksy__rating-stars">★ {business.rating.value}</span>
                <span>·</span>
                <span>{business.rating.count} opinii</span>
                <span>·</span>
                <span>{business.priceRange}</span>
              </div>
            )}
          </div>
          <a
            href={BOOKSY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="booksy__cta"
            data-cursor-text="UMÓW"
          >
            Umów na Booksy
          </a>
        </div>

        {popularServices.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <p className="booksy__popular-label">
              Najczęściej wybierane
            </p>
            <div className="booksy__popular-grid">
              {popularServices.slice(0, 4).map((s) => (
                <PopularCard key={s.id} service={s} />
              ))}
            </div>
          </div>
        )}

        {!catalogOpen && (
          <div style={{ marginBottom: 32 }}>
            <p className="booksy__categories-label">
              Kategorie
            </p>
            <div className="booksy-category-preview">
              {catalogCategories.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className="booksy-category-chip"
                  onClick={() => openCatalog(c.name)}
                >
                  <span>{c.name}</span>
                  <span className="booksy-category-chip-count">{c.serviceCount}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="booksy-amenities-wrap">
          {amenities.slice(0, catalogOpen ? amenities.length : 4).map((a) => (
            <span key={a} className="booksy-amenity-tag">{a}</span>
          ))}
          {!catalogOpen && amenities.length > 4 && (
            <span className="booksy-amenity-tag booksy-amenity-tag--muted">+{amenities.length - 4}</span>
          )}
        </div>

        <button
          type="button"
          className="booksy-catalog-toggle"
          onClick={() => setCatalogOpen((v) => !v)}
          aria-expanded={catalogOpen}
          aria-controls="cennik-pelny"
        >
          {catalogOpen ? 'Ukryj pełny cennik' : `Pokaż pełny cennik · ${totalCount} usług`}
          <span className="booksy-catalog-toggle-icon">{catalogOpen ? '−' : '+'}</span>
        </button>

        {catalogOpen && (
          <div id="cennik-pelny" className="booksy-catalog-panel">
            <div className="booksy-search-wrap">
              <input
                type="search"
                placeholder="Szukaj usługi…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Szukaj usługi"
                className="booksy-search"
              />
            </div>

            <div className="booksy-catalog-layout">
              <nav className="booksy-categories" aria-label="Kategorie usług">
                <CategoryBtn label="Wszystkie" active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} count={totalCount} />
                {catalogCategories.map((c) => (
                  <CategoryBtn
                    key={c.name}
                    label={c.name}
                    active={activeCategory === c.name}
                    onClick={() => setActiveCategory(c.name)}
                    count={c.serviceCount}
                  />
                ))}
              </nav>

              <div className="booksy-services-scroll">
                {filteredServices.length === 0 ? (
                  <p style={{ fontFamily: S.sans, color: C.textMuted, fontSize: 15, padding: '24px 32px' }}>
                    Brak wyników dla „{query}”.
                  </p>
                ) : (
                  <ul className="booksy-services-list">
                    {filteredServices.map((service) => (
                      <ServiceRow key={service.id} service={service} />
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <p className="booksy-catalog-hint">
              Pełna rezerwacja i aktualne ceny zawsze na{' '}
              <a href={BOOKSY_URL} target="_blank" rel="noopener noreferrer">Booksy</a>.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

const CategoryBtn: React.FC<{
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}> = ({ label, active, count, onClick }) => (
  <button type="button" onClick={onClick} className={`booksy-cat-btn${active ? ' is-active' : ''}`}>
    <span>{label}</span>
    <span style={{ fontSize: 10, opacity: active ? 0.9 : 0.6 }}>{count}</span>
  </button>
);

const PopularCard: React.FC<{ service: BooksyService }> = ({ service }) => (
  <a
    href={getBooksyBookingUrl(service.id)}
    target="_blank"
    rel="noopener noreferrer"
    className="booksy-popular-card"
    data-cursor-text="REZERWUJ"
  >
    <div className="booksy-popular-card__title">
      {decodeHtmlEntities(service.name)}
    </div>
    <div className="booksy-popular-card__meta">
      <span className="booksy-popular-card__price">{formatPrice(service)}</span>
      <span>{formatDuration(service)}</span>
    </div>
  </a>
);

const ServiceRow: React.FC<{ service: BooksyService }> = ({ service }) => (
  <li className="booksy-service-row">
    <div>
      <div className="booksy-service-row__name">{decodeHtmlEntities(service.name)}</div>
      {service.description && (
        <div className="booksy-service-row__desc">
          {decodeHtmlEntities(service.description)}
        </div>
      )}
      <div className="booksy-service-row__cat">
        {service.category}
      </div>
    </div>
    <div className="booksy-service-row__duration">{formatDuration(service)}</div>
    <div className="booksy-service-row__action">
      <span className="booksy-service-row__price">{formatPrice(service)}</span>
      <a
        href={getBooksyBookingUrl(service.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="booksy-book-link"
        data-cursor-text="UMÓW"
      >
        Umów
      </a>
    </div>
  </li>
);

export default BooksyPricing;
