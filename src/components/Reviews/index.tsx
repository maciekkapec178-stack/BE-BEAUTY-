import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { C, S } from '../../theme';
import { site, getBooksyBookingUrl } from '../../lib/site-content';
import { fetchAllReviews, submitReview, type Review } from '../../lib/reviews-api';
import './Reviews.css';

const STAR_LABELS = ['Słabo', 'Średnio', 'Dobrze', 'Bardzo dobrze', 'Idealnie'];

function starsDisplay(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

const Reviews: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchStarted, setFetchStarted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [service, setService] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || fetchStarted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setFetchStarted(true);
        observer.disconnect();
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchStarted]);

  useEffect(() => {
    if (!fetchStarted) return;
    let cancelled = false;
    void fetchAllReviews().then((data) => {
      if (!cancelled) {
        setAllReviews(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchStarted]);

  useEffect(() => {
    if (!listRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        listRef.current!.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: listRef.current, start: 'top 85%', once: true },
        },
      );
    }, listRef);
    return () => ctx.revert();
  }, [allReviews, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    setSubmitting(true);

    const result = await submitReview({
      author,
      body,
      service: service || undefined,
      rating,
    });

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setAllReviews((prev) => [result.review, ...prev]);
    setAuthor('');
    setBody('');
    setService('');
    setRating(5);
    setFormSuccess(true);
    setShowForm(false);
  };

  const ratingBooksy = site.booksy.rating;
  /** Opinie z Booksy — bez opinii dodanych przez formularz na stronie */
  const displayedReviews = allReviews.filter((r) => r.source !== 'site');
  const totalCount = ratingBooksy?.count ?? displayedReviews.length;

  return (
    <section ref={sectionRef} id="opinie" className="reviews-section">
      <div className="reviews-container">
        <div className="reviews__header">
          <div>
            <p className="reviews__eyebrow">
              {totalCount}+ opinii · Booksy i strona
            </p>
            <h2 className="reviews__title">
              Co mówią<br />
              <em>Klientki</em>
            </h2>
            {ratingBooksy && (
              <p className="reviews__rating-summary">
                <span className="reviews__rating-val">★ {ratingBooksy.value}</span>
                {' · '}
                średnia ocena na Booksy
              </p>
            )}
          </div>
          <div className="reviews__actions">
            <button
              type="button"
              className={`reviews__cta-toggle ${showForm ? 'is-active' : ''}`}
              onClick={() => {
                setShowForm((v) => !v);
                setFormError(null);
                setFormSuccess(false);
              }}
              data-cursor-text={showForm ? 'ZAMKNIJ' : 'PISZ'}
            >
              {showForm ? 'Anuluj' : 'Wystaw opinię'}
            </button>
            <a
              href={getBooksyBookingUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="reviews__cta-primary"
              data-cursor-text="UMÓW"
            >
              Umów wizytę
            </a>
          </div>
        </div>

        {formSuccess && (
          <p className="reviews__success-msg">
            Dziękujemy! Twoja opinia została zapisana.
          </p>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="reviews-form">
            <div className="reviews-form__field">
              <label className="reviews-form__label" htmlFor="review-author">Imię</label>
              <input
                id="review-author"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="reviews-form__input"
                placeholder="np. Anna"
              />
            </div>
            <div className="reviews-form__field">
              <label className="reviews-form__label" htmlFor="review-service">Usługa (opcjonalnie)</label>
              <input
                id="review-service"
                type="text"
                maxLength={120}
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="reviews-form__input"
                placeholder="np. Geometria brwi"
              />
            </div>
            <div className="reviews-form__field reviews-form__field--full">
              <label className="reviews-form__label" htmlFor="review-body">Twoja opinia</label>
              <textarea
                id="review-body"
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="reviews-form__textarea"
                placeholder="Opisz wizytę — efekt, obsługa, atmosfera…"
              />
            </div>
            <div className="reviews-form__field reviews-form__field--full">
              <span className="reviews-form__label">Ocena</span>
              <div className="reviews-form__stars-container">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} gwiazdek`}
                    className={`reviews-form__star-btn ${rating >= n ? 'is-active' : ''}`}
                  >
                    ★
                  </button>
                ))}
                <span className="reviews-form__star-label">
                  {STAR_LABELS[rating - 1]}
                </span>
              </div>
            </div>
            {formError && (
              <p className="reviews-form__error">
                {formError}
              </p>
            )}
            <div className="reviews-form__field reviews-form__field--full">
              <button
                type="submit"
                disabled={submitting}
                className="reviews-form__submit"
              >
                {submitting ? 'Zapisywanie…' : 'Opublikuj opinię'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p style={{ fontFamily: S.sans, fontSize: 14, color: C.textMuted }}>Ładowanie opinii…</p>
        ) : (
          <div ref={listRef} className="reviews-grid">
            {displayedReviews.map((review) => (
              <article key={review.id} className="reviews-card">
                <div className="reviews-card__stars-row">
                  <div className="reviews-card__stars">
                    {starsDisplay(review.rating)}
                  </div>
                  {review.source === 'site' && (
                    <span className="reviews-card__badge">
                      Nowa
                    </span>
                  )}
                </div>
                <p className="reviews-card__body">
                  „{review.body}”
                </p>
                <div>
                  <div className="reviews-card__author">
                    {review.author}
                  </div>
                  {review.service && (
                    <div className="reviews-card__service">
                      {review.service}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Reviews;
