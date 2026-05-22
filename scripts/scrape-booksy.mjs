/**
 * Booksy: Playwright → booksy-raw.html → data/booksy-scrape.json → aktualizacja site-content (usługi, opinie).
 * npm run scrape:booksy
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'booksy-raw.html');
const outPath = path.join(root, 'data', 'booksy-scrape.json');
const sitePath = path.join(root, 'data', 'site-content.json');

const SOURCE_URL =
  'https://booksy.com/pl-pl/102760_be-beauty-salon-urody-brow-academy-malgorzata-szymajda_salon-kosmetyczny_15570_luban#ba_s=seo';

const DAY_PL = {
  Monday: 'Poniedziałek',
  Tuesday: 'Wtorek',
  Wednesday: 'Środa',
  Thursday: 'Czwartek',
  Friday: 'Piątek',
  Saturday: 'Sobota',
  Sunday: 'Niedziela',
};

function parsePrice(text) {
  const m = text.replace(/\u00a0/g, ' ').match(/([\d]+(?:[.,]\d{2})?)\s*zł/);
  if (!m) return null;
  return { amount: parseFloat(m[1].replace(',', '.')), currency: 'PLN', fromPrice: text.includes('+') };
}

function parseDuration(text) {
  if (!text) return null;
  const t = text.trim();
  const minOnly = t.match(/^(\d+)\s*min$/);
  if (minOnly) return { minutes: parseInt(minOnly[1]), label: t };
  const hm = t.match(/(\d+)g\s*(\d+)?\s*min/);
  if (hm) {
    const h = parseInt(hm[1]);
    const m = hm[2] ? parseInt(hm[2]) : 0;
    return { minutes: h * 60 + m, label: t };
  }
  const hOnly = t.match(/^(\d+)g$/);
  if (hOnly) return { minutes: parseInt(hOnly[1]) * 60, label: t };
  return { label: t };
}

function formatHours(specs) {
  if (!specs?.length) return [];
  const groups = new Map();
  for (const s of specs) {
    const days = Array.isArray(s.dayOfWeek) ? s.dayOfWeek : [s.dayOfWeek];
    const key = `${s.opens} – ${s.closes}`;
    const plDays = days.map((d) => DAY_PL[d] ?? d);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(...plDays);
  }
  return [...groups.entries()].map(([hours, days]) => ({
    day: days.join(', '),
    hours,
  }));
}

async function fetchHtml() {
  console.log('Pobieram Booksy…', SOURCE_URL);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'pl-PL',
    viewport: { width: 1280, height: 900 },
  });

  await page.goto(SOURCE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2500);

  for (const re of [/akceptuj|accept all|zgadzam/i, /odrzuć|reject/i]) {
    const btn = page.locator('button').filter({ hasText: re }).first();
    if (await btn.isVisible({ timeout: 1200 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(600);
    }
  }

  for (let i = 0; i < 12; i++) {
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(500);
  }

  await page.waitForSelector('[data-testid="service-name"], #service-', { timeout: 15000 }).catch(() => {});
  const html = await page.content();
  await browser.close();
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`Zapisano ${htmlPath} (${html.length} znaków)`);
  return html;
}

function parseHtml(html) {
  let jsonLd = null;
  const ldMatch = html.match(/data-hid="ld-json-0"[^>]*>([\s\S]*?)<\/script>/);
  if (ldMatch) {
    try {
      jsonLd = JSON.parse(ldMatch[1]);
    } catch (e) {
      console.warn('JSON-LD parse failed', e.message);
    }
  }

  const services = [];
  const serviceItemRegex =
    /id="service-(\d+)"[^>]*data-ba-cb-section-title="([^"]*)"[\s\S]*?data-testid="service-name"[^>]*>\s*([\s\S]*?)\s*<\/h[34]>[\s\S]*?data-testid="service-price"[^>]*>([^<]+)<[\s\S]*?data-testid="service-duration"[^>]*>([^<]+)</g;

  let match;
  while ((match = serviceItemRegex.exec(html)) !== null) {
    const id = match[1];
    const category = match[2];
    const nameHtml = match[3];
    const name = nameHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const priceLabel = match[4].replace(/\u00a0/g, ' ').trim();
    const durationLabel = match[5].trim();
    const descMatch = nameHtml.match(/<span[^>]*>([^<]+)<\/span>/);
    services.push({
      id,
      category,
      name,
      description: descMatch ? descMatch[1].trim() : null,
      price: parsePrice(priceLabel),
      priceLabel,
      duration: parseDuration(durationLabel),
    });
  }

  const categoriesMap = new Map();
  for (const s of services) {
    if (!categoriesMap.has(s.category)) categoriesMap.set(s.category, []);
    categoriesMap.get(s.category).push(s);
  }

  const categories = [...categoriesMap.entries()].map(([name, items]) => ({
    name,
    serviceCount: items.length,
    services: items,
  }));

  const reviews = [];
  const reviewChunks = html.split('data-testid="review-item"').slice(1);
  for (const chunk of reviewChunks.slice(0, 50)) {
    const author = chunk.match(/data-testid="review-author"[\s\S]*?>([^<]+)</)?.[1]?.trim();
    const date = chunk.match(/data-testid="review-date"[\s\S]*?>([^<]+)</)?.[1]?.trim();
    const service = chunk.match(/data-testid="review-service"[\s\S]*?>([^<]+)</)?.[1]?.trim();
    const staff = chunk.match(/data-testid="review-staff"[\s\S]*?>([^<]+)</)?.[1]?.trim();
    const body = chunk.match(/data-testid="review-body"[\s\S]*?>([^<]+)</)?.[1]?.trim();
    if (author) reviews.push({ author, date, service, staff, body });
  }

  const amenities = [...html.matchAll(/data-testid="amenity-name"[^>]*>([^<]+)</g)].map((m) => m[1].trim());

  const ratingMatch = html.match(/(\d+\.\d)\s*\((\d+)\s+opinii\)/);

  return {
    scrapedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL.replace(/#.*$/, ''),
    business: {
      id: '102760',
      name: jsonLd?.name ?? 'BE BEAUTY Salon Urody & BROW ACADEMY Małgorzata Szymajda',
      description: jsonLd?.description ?? null,
      address: jsonLd?.address
        ? {
            street: jsonLd.address.streetAddress,
            city: jsonLd.address.addressLocality,
            postalCode: jsonLd.address.postalCode,
            country: jsonLd.address.addressCountry,
          }
        : { street: 'Fabryczna Osiedle 8/3', city: 'Lubań', postalCode: '59-800', country: 'PL' },
      geo: jsonLd?.geo ?? null,
      telephone: jsonLd?.telephone ?? null,
      image: jsonLd?.image ?? null,
      logo: jsonLd?.logo ?? null,
      url: jsonLd?.url ?? SOURCE_URL.replace(/#.*$/, ''),
      rating: ratingMatch
        ? { value: parseFloat(ratingMatch[1]), count: parseInt(ratingMatch[2]) }
        : jsonLd?.aggregateRating
          ? {
              value: parseFloat(jsonLd.aggregateRating.ratingValue),
              count: parseInt(jsonLd.aggregateRating.reviewCount),
            }
          : null,
      priceRange: jsonLd?.priceRange ?? null,
      openingHours: jsonLd?.openingHoursSpecification ?? null,
    },
    amenities: amenities.length
      ? amenities
      : ['Parking', 'Internet (Wi-Fi)', 'Akceptacja kart płatniczych', 'Program lojalnościowy'],
    categories,
    servicesFlat: services,
    servicesCount: services.length,
    reviewsSample: reviews,
    reviewsTotalPages: (html.match(/data-testid="paginator-next-button"/g) || []).length ? 12 : null,
  };
}

function mergeIntoSite(scrape) {
  if (!fs.existsSync(sitePath)) {
    console.warn('Brak site-content.json — pomijam merge');
    return;
  }
  const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'));
  const popular =
    scrape.categories.find((c) => c.name === 'Popularne usługi')?.services ?? [];

  site.scrapedAt = scrape.scrapedAt;
  site.brand = site.brand ?? {};
  site.brand.legalName = scrape.business.name;
  if (scrape.business.description) {
    site.description = scrape.business.description.replace(/\r\n/g, ' ').trim();
  }
  site.links = site.links ?? {};
  site.links.booksy = scrape.sourceUrl;
  site.links.booksyBusinessId = scrape.business.id;

  site.booksy = {
    url: scrape.sourceUrl,
    businessId: scrape.business.id,
    rating: scrape.business.rating,
    priceRange: scrape.business.priceRange,
    amenities: scrape.amenities,
    openingHours: formatHours(scrape.business.openingHours),
    categories: scrape.categories,
    servicesCount: scrape.servicesCount,
    popularServices: popular,
  };

  site.reviews = scrape.reviewsSample.slice(0, 10).map((r) => ({
    author: r.author,
    body: r.body,
    service: r.service ?? null,
    staff: r.staff ?? 'Małgorzata Szymajda-Drożdżewska',
  }));

  const rating = scrape.business.rating;
  site.stats = (site.stats ?? []).map((s) =>
    s.label?.includes('Ocena Booksy')
      ? { value: String(rating?.value ?? '5.0'), label: `Ocena Booksy (${rating?.count ?? 119})` }
      : s.label?.includes('Usług w ofercie')
        ? { value: String(scrape.servicesCount ?? 93), label: 'Usług w ofercie' }
        : s,
  );

  fs.writeFileSync(sitePath, JSON.stringify(site, null, 2), 'utf8');
  console.log(`Zaktualizowano ${sitePath} (galeria bez zmian)`);
}

async function main() {
  const html = await fetchHtml();
  const scrape = parseHtml(html);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(scrape, null, 2), 'utf8');
  console.log(`Saved ${outPath}`);
  console.log(
    `Services: ${scrape.servicesCount}, Categories: ${scrape.categories.length}, Reviews: ${scrape.reviewsSample.length}, Rating: ${scrape.business.rating?.value} (${scrape.business.rating?.count})`,
  );
  mergeIntoSite(scrape);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
