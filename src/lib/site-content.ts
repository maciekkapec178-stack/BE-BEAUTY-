import siteData from '../../data/site-content.json';
import type { BooksyCategory, BooksyService } from './booksy';

export const site = siteData;

export const BOOKSY_URL = site.links.booksy;
export const BOOKSY_BUSINESS_ID = site.links.booksyBusinessId;
export const FACEBOOK_URL = site.links.facebook;
export const INSTAGRAM_URL = site.links.instagram;

export const SOCIAL_LINKS = [
  { label: 'Instagram', href: INSTAGRAM_URL },
  { label: 'Facebook', href: FACEBOOK_URL },
] as const;

/** Stały URL — jeden raz, bez przeładowań iframe przy re-renderze. */
export const GOOGLE_MAPS_EMBED_URL = (() => {
  const { latitude, longitude } = site.contact.geo;
  const q = encodeURIComponent(site.contact.address.full);
  return `https://www.google.com/maps?q=${q}&ll=${latitude},${longitude}&z=16&hl=pl&output=embed`;
})();

export function getGoogleMapsEmbedUrl(): string {
  return GOOGLE_MAPS_EMBED_URL;
}

export function getGoogleMapsDirectionsUrl(): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.contact.address.full)}`;
}

/**
 * Link do rezerwacji na profilu Booksy (działa w przeglądarce).
 * Z serviceId — przewija do wiersza usługi (#service-{id}); rezerwacja przez „Umów” na Booksy.
 * Bez serviceId — profil salonu.
 */
export function getBooksyBookingUrl(serviceId?: string): string {
  const profile = (site.booksy.url || BOOKSY_URL).split('#')[0];
  if (!serviceId) return profile;
  return `${profile}#service-${encodeURIComponent(serviceId)}`;
}

export const business = {
  id: site.booksy.businessId,
  name: site.brand.legalName,
  description: site.description,
  address: {
    street: site.contact.address.full,
    city: site.contact.address.city,
    postalCode: site.contact.address.postalCode,
    country: site.contact.address.country,
  },
  geo: site.contact.geo,
  telephone: site.contact.phone,
  image: site.images.hero,
  logo: site.images.logo,
  url: site.booksy.url,
  rating: site.booksy.rating,
  priceRange: site.booksy.priceRange,
  openingHours: site.booksy.openingHours.map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.day.split(', '),
    opens: h.hours.split(' – ')[0],
    closes: h.hours.split(' – ')[1],
  })),
};

export const categories = site.booksy.categories as BooksyCategory[];
export const amenities = site.booksy.amenities;
export const popularServices = site.booksy.popularServices as BooksyService[];
export const catalogCategories = categories.filter((c) => c.name !== 'Popularne usługi');
export const allServices = catalogCategories.flatMap((c) => c.services);
export const reviews = site.reviews;
export const galleryImages = site.images.gallery.filter((src) => !src.includes('logo'));

export function formatOpeningHours() {
  return site.booksy.openingHours;
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeDescription(text?: string | null) {
  const raw = text ?? site.description;
  return decodeHtmlEntities(raw.replace(/\r\n/g, ' ').trim());
}

export { formatPrice, formatDuration } from './booksy';
