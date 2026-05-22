/**
 * Pobiera zdjęcia salonu z Booksy (galeria, portfolio usług, opinie).
 * npm run scrape:booksy:images
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'images', 'social');
const manifestPath = path.join(root, 'data', 'booksy-images.json');
const booksyScrapePath = path.join(root, 'data', 'booksy-scrape.json');
const htmlPath = path.join(root, 'booksy-raw.html');

const SOURCE_URL =
  'https://booksy.com/pl-pl/102760_be-beauty-salon-urody-brow-academy-malgorzata-szymajda_salon-kosmetyczny_15570_luban';
const REFERER = 'https://booksy.com/';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function normalizeUrl(url) {
  if (!url || !url.includes('cloudfront.net/region2/pl/102760/')) return null;
  const base = url.split('?')[0];
  if (base.includes('/users/')) return null;
  if (base.endsWith('.svg')) return null;
  return base;
}

function extractFromHtml(html) {
  const urls = new Map();
  const re =
    /https:\/\/d375139ucebi94\.cloudfront\.net\/region2\/pl\/102760\/(?:biz_photo|service_photos|review_photos)\/[^"'\\s<>]+\.(?:jpe?g|png|webp)/gi;
  for (const m of html.matchAll(re)) {
    const n = normalizeUrl(m[0]);
    if (n) urls.set(n, classify(n));
  }
  return urls;
}

function classify(url) {
  if (url.includes('/biz_photo/')) return 'gallery';
  if (url.includes('/service_photos/')) return 'service';
  if (url.includes('/review_photos/')) return 'review';
  return 'other';
}

function score(item) {
  let s = 0;
  if (item.type === 'gallery') s += 20;
  if (item.type === 'service') s += 10;
  if (item.type === 'review') s += 5;
  return s;
}

async function collectWithPlaywright() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: UA, locale: 'pl-PL', viewport: { width: 1280, height: 900 } });
  const urls = new Map();

  page.on('response', (res) => {
    const u = normalizeUrl(res.url());
    if (u && res.request().resourceType() === 'image') urls.set(u, classify(u));
  });

  await page.goto(SOURCE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2000);

  for (const re of [/akceptuj|accept all|zgadzam/i]) {
    const btn = page.locator('button').filter({ hasText: re }).first();
    if (await btn.isVisible({ timeout: 1200 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  }

  const showAll = page.locator('[data-testid="show-all-photos-button"]');
  if (await showAll.isVisible({ timeout: 5000 }).catch(() => false)) {
    await showAll.click();
    await page.waitForTimeout(2500);
  }

  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(400);
  }

  const html = await page.content();
  fs.writeFileSync(htmlPath, html, 'utf8');
  for (const [u, t] of extractFromHtml(html)) urls.set(u, t);

  await browser.close();
  return urls;
}

async function downloadOne(item, index) {
  const filename = `booksy-${String(index + 1).padStart(2, '0')}.jpg`;
  const filepath = path.join(outDir, filename);
  try {
    const res = await fetch(item.url, {
      headers: { 'User-Agent': UA, Referer: REFERER, Accept: 'image/*' },
    });
    if (!res.ok) {
      console.log(`  skip ${res.status} ${filename}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 8000) return null;
    fs.writeFileSync(filepath, buf);
    return {
      id: `booksy-${index + 1}`,
      type: item.type,
      filename,
      localPath: `/images/social/${filename}`,
      originalUrl: item.url,
      bytes: buf.length,
    };
  } catch (e) {
    console.log(`  err ${filename}: ${e.message}`);
    return null;
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Zbieram URL-e z Booksy…');
  const urlMap = await collectWithPlaywright();

  const booksyJson = fs.existsSync(booksyScrapePath)
    ? JSON.parse(fs.readFileSync(booksyScrapePath, 'utf8'))
    : null;
  if (booksyJson?.business?.image) {
    const u = normalizeUrl(booksyJson.business.image);
    if (u) urlMap.set(u, 'gallery');
  }
  if (booksyJson?.business?.logo) {
    const u = normalizeUrl(booksyJson.business.logo);
    if (u) urlMap.set(u, 'logo');
  }

  const ranked = [...urlMap.entries()]
    .map(([url, type]) => ({ url, type }))
    .filter((x) => x.type !== 'logo')
    .sort((a, b) => score(b) - score(a));

  const maxGallery = 12;
  const maxService = 6;
  const maxReview = 4;
  const queue = [];
  let g = 0,
    s = 0,
    r = 0;
  for (const item of ranked) {
    if (item.type === 'gallery' && g < maxGallery) {
      queue.push(item);
      g++;
    } else if (item.type === 'service' && s < maxService) {
      queue.push(item);
      s++;
    } else if (item.type === 'review' && r < maxReview) {
      queue.push(item);
      r++;
    }
  }

  console.log(`Pobieranie ${queue.length} zdjęć (galeria: ${g}, usługi: ${s}, opinie: ${r})…`);
  const images = [];
  for (const item of queue) {
    const saved = await downloadOne(item, images.length);
    if (saved) {
      images.push(saved);
      console.log(`  ok ${saved.filename} (${saved.type})`);
    }
  }

  const manifest = {
    scrapedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL,
    count: images.length,
    gallery: images.filter((i) => i.type === 'gallery').map((i) => i.localPath),
    services: images.filter((i) => i.type === 'service').map((i) => i.localPath),
    reviews: images.filter((i) => i.type === 'review').map((i) => i.localPath),
    images,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  if (fs.existsSync(booksyScrapePath)) {
    const scrape = JSON.parse(fs.readFileSync(booksyScrapePath, 'utf8'));
    scrape.photos = manifest;
    fs.writeFileSync(booksyScrapePath, JSON.stringify(scrape, null, 2), 'utf8');
  }

  const sitePath = path.join(root, 'data', 'site-content.json');
  if (fs.existsSync(sitePath) && images.length) {
    const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'));
    site.booksy = site.booksy ?? {};
    site.booksy.photos = manifest.gallery;
    site.booksy.photoManifest = manifestPath.replace(/\\/g, '/').split('/data/')[1]
      ? `data/booksy-images.json`
      : 'data/booksy-images.json';
    const heroCandidate = images.find((i) => i.type === 'gallery');
    if (heroCandidate && !site.images?.hero?.includes('hero-fb-photo')) {
      site.images = site.images ?? {};
      site.images.booksyHero = heroCandidate.localPath;
    }
    fs.writeFileSync(sitePath, JSON.stringify(site, null, 2), 'utf8');
    console.log(`Zaktualizowano site-content.json → booksy.photos (${manifest.gallery.length})`);
  }

  console.log(`\nZapisano ${images.length} plików → public/images/social/booksy-*.jpg`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
