export type BooksyService = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  price: { amount: number; currency: string; fromPrice: boolean } | null;
  priceLabel: string;
  duration: { minutes?: number; label: string } | null;
};

export type BooksyCategory = {
  name: string;
  serviceCount: number;
  services: BooksyService[];
};

function sanitizeLabel(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatPrice(service: BooksyService): string {
  if (service.priceLabel) {
    return sanitizeLabel(service.priceLabel);
  }
  if (!service.price) return '—';
  const suffix = service.price.fromPrice ? '+' : '';
  const amount = service.price.amount;
  const formatted =
    Number.isInteger(amount) || amount % 1 === 0
      ? `${Math.round(amount)},00`
      : amount.toFixed(2).replace('.', ',');
  return `${formatted} zł${suffix}`;
}

export function formatDuration(service: BooksyService): string {
  const label = service.duration?.label?.trim();
  if (!label) return '—';
  return sanitizeLabel(label);
}

export {
  business,
  amenities,
  catalogCategories,
  popularServices,
} from './site-content';
