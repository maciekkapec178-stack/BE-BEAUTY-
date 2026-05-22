import { reviews as staticReviews } from './site-content';
import { supabase, supabaseConfigured } from './supabase';

export type Review = {
  id: string;
  author: string;
  body: string;
  service?: string;
  rating: number;
  createdAt: string;
  source: 'site' | 'booksy';
};

export type ReviewInput = {
  author: string;
  body: string;
  service?: string;
  rating: number;
};

const STORAGE_KEY = 'be-beauty-site-reviews';

function staticAsReviews(): Review[] {
  return staticReviews.map((r, i) => ({
    id: `booksy-${i}`,
    author: r.author,
    body: r.body,
    service: r.service,
    rating: 5,
    createdAt: '1970-01-01T00:00:00.000Z',
    source: 'booksy' as const,
  }));
}

function readLocalReviews(): Review[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Review[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalReviews(items: Review[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function fetchAllReviews(): Promise<Review[]> {
  const booksy = staticAsReviews();
  let site: Review[] = [];

  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('be_beauty_reviews')
      .select('id, author, body, service, rating, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      site = data.map((row) => ({
        id: row.id,
        author: row.author,
        body: row.body,
        service: row.service ?? undefined,
        rating: row.rating ?? 5,
        createdAt: row.created_at,
        source: 'site' as const,
      }));
    }
  }

  if (!site.length) {
    site = readLocalReviews();
  }

  const merged = [...site, ...booksy];
  merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return merged;
}

export async function submitReview(input: ReviewInput): Promise<{ ok: true; review: Review } | { ok: false; error: string }> {
  const author = input.author.trim();
  const body = input.body.trim();
  const service = input.service?.trim() || undefined;

  if (author.length < 2) {
    return { ok: false, error: 'Podaj imię (min. 2 znaki).' };
  }
  if (body.length < 10) {
    return { ok: false, error: 'Opinia musi mieć co najmniej 10 znaków.' };
  }
  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: 'Wybierz ocenę od 1 do 5 gwiazdek.' };
  }

  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('be_beauty_reviews')
      .insert({
        author,
        body,
        service: service ?? null,
        rating: input.rating,
      })
      .select('id, author, body, service, rating, created_at')
      .single();

    if (error) {
      return { ok: false, error: 'Nie udało się zapisać opinii. Spróbuj ponownie za chwilę.' };
    }

    const review: Review = {
      id: data.id,
      author: data.author,
      body: data.body,
      service: data.service ?? undefined,
      rating: data.rating,
      createdAt: data.created_at,
      source: 'site',
    };
    return { ok: true, review };
  }

  const review: Review = {
    id: `local-${Date.now()}`,
    author,
    body,
    service,
    rating: input.rating,
    createdAt: new Date().toISOString(),
    source: 'site',
  };
  const local = readLocalReviews();
  writeLocalReviews([review, ...local]);
  return { ok: true, review };
}
