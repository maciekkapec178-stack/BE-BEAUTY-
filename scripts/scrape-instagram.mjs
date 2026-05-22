/**
 * Instagram: Playwright + pobranie zdjęć postów.
 * npm run scrape:instagram
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'images', 'social');
const cacheMain = path.join(root, 'cache-instagram-main.html');
const manifestPath = path.join(root, 'data', 'instagram-scrape.json');
const sitePath = path.join(root, 'data', 'site-content.json');

const IG_PROFILE = 'https://www.instagram.com/malgorzata_szymajda/';
const USERNAME = 'malgorzata_szymajda';
const MAX_POSTS = 30;
const SCROLL_ROUNDS = 10;

function isPostImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const u = url.toLowerCase();
  if (u.includes('rsrc.php') || u.includes('/static.') || u.endsWith('.gif')) return false;
  if (u.includes('profile_pic') || u.includes('150x150') || u.includes('s150x150')) return false;
  return (
    u.includes('cdninstagram.com') ||
    u.includes('fbcdn.net') ||
    u.includes('scontent')
  );
}

function pickBestFromSrcset(srcset) {
  if (!srcset) return null;
  const parts = srcset.split(',').map((s) => s.trim());
  const last = parts[parts.length - 1]?.split(/\s+/)[0];
  return last || parts[0]?.split(/\s+/)[0] || null;
}

async function scrapeWithPlaywright() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'pl-PL',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const networkImages = new Map();

  page.on('response', async (res) => {
    try {
      const url = res.url();
      if (res.request().resourceType() !== 'image' || !res.ok()) return;
      if (!isPostImageUrl(url)) return;
      const body = await res.body();
      if (body.length < 15000) return;
      const key = url.split('?')[0];
      const prev = networkImages.get(key);
      if (!prev || body.length > prev.bytes) {
        networkImages.set(key, { url, body, bytes: body.length });
      }
    } catch {
      /* ignore */
    }
  });

  console.log('Otwieram profil…');
  await page.goto(IG_PROFILE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);

  for (const re of [/akceptuj|accept all|allow all|zgadzam/i, /nie teraz|not now|później|later/i]) {
    const btn = page.locator('button, [role="button"]').filter({ hasText: re }).first();
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(800);
    }
  }

  for (let i = 0; i < SCROLL_ROUNDS; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.2));
    await page.waitForTimeout(1800);
    console.log(`  scroll ${i + 1}/${SCROLL_ROUNDS}`);
  }


  const meta = await page.evaluate(() => ({
    title: document.querySelector('meta[property="og:title"]')?.content ?? null,
    description: document.querySelector('meta[property="og:description"]')?.content ?? null,
    ogImage: document.querySelector('meta[property="og:image"]')?.content ?? null,
  }));

  const html = await page.content();
  fs.writeFileSync(cacheMain, html, 'utf8');

  const gridCount = await page.locator('a[href*="/p/"]').count();
  console.log(`  widocznych postów w siatce: ${gridCount}`);

  return { networkImages: [...networkImages.values()], meta, html, context, browser };
}

async function downloadWithContext(context, url, filename) {
  const filepath = path.join(outDir, filename);
  if (!url?.startsWith('http')) return null;
  try {
    const res = await context.request.get(url, {
      headers: { Referer: IG_PROFILE, Accept: 'image/*' },
    });
    if (!res.ok()) {
      console.log(`  skip ${res.status()} ${filename}`);
      return null;
    }
    const buf = Buffer.from(await res.body());
    if (buf.length < 8000) {
      console.log(`  skip small ${buf.length}B ${filename}`);
      return null;
    }
    fs.writeFileSync(filepath, buf);
    return {
      filename,
      localPath: `/images/social/${filename}`,
      originalUrl: url,
      bytes: buf.length,
    };
  } catch (e) {
    console.log(`  err ${filename}: ${e.message?.slice(0, 60)}`);
    return null;
  }
}

function rankUrl(url) {
  let s = 0;
  const u = url.toLowerCase();
  if (u.includes('/v/t51.')) s += 10;
  if (u.includes('scontent')) s += 8;
  if (u.includes('e35')) s += 4;
  if (u.includes('1080')) s += 3;
  if (u.includes('640')) s += 1;
  if (u.includes('rsrc')) s -= 20;
  if (u.endsWith('.gif')) s -= 20;
  return s;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const { networkImages, meta, context, browser } = await scrapeWithPlaywright();
  const ranked = networkImages.sort((a, b) => b.bytes - a.bytes);
  console.log(`Zdjęć z sieci (≥15 KB): ${ranked.length}`);

  const images = [];
  for (const item of ranked.slice(0, MAX_POSTS)) {
    const filename = `instagram-${String(images.length + 1).padStart(2, '0')}.jpg`;
    const filepath = path.join(outDir, filename);
    fs.writeFileSync(filepath, item.body);
    const saved = {
      filename,
      localPath: `/images/social/${filename}`,
      originalUrl: item.url,
      bytes: item.bytes,
    };
    images.push(saved);
    console.log(`  ok ${saved.filename} (${Math.round(saved.bytes / 1024)} KB)`);
  }

  if (images.length < MAX_POSTS) {
    console.log('  uzupełnianie z DOM…');
    const page = context.pages()[0];
    if (!page) {
      console.log('  brak otwartej karty — pomijam uzupełnienie');
    } else {
    const domUrls = await page.evaluate(() => {
      const out = [];
      const seen = new Set();
      document.querySelectorAll('a[href*="/p/"] img').forEach((img) => {
        const ss = img.getAttribute('srcset');
        let best = img.currentSrc || img.src;
        if (ss) {
          let maxW = 0;
          for (const part of ss.split(',')) {
            const [u, w] = part.trim().split(/\s+/);
            const width = parseInt(w, 10) || 0;
            if (width >= maxW) {
              maxW = width;
              best = u;
            }
          }
        }
        const key = best?.split('?')[0];
        if (best?.startsWith('http') && key && !seen.has(key)) {
          seen.add(key);
          out.push(best);
        }
      });
      return out;
    });
      for (const url of domUrls) {
        if (images.length >= MAX_POSTS) break;
        const saved = await downloadWithContext(
          context,
          url,
          `instagram-${String(images.length + 1).padStart(2, '0')}.jpg`,
        );
        if (saved) {
          images.push(saved);
          console.log(`  ok ${saved.filename} (${Math.round(saved.bytes / 1024)} KB)`);
        }
      }
    }
  }

  await browser.close();

  const profile = {
    handle: `@${USERNAME}`,
    url: IG_PROFILE,
    title: meta.title,
    description: meta.description,
    ogImage: meta.ogImage,
  };

  const manifest = {
    scrapedAt: new Date().toISOString(),
    profile: IG_PROFILE,
    meta: profile,
    imageUrlsFound: ranked.length,
    gridNote: 'Profil: https://www.instagram.com/malgorzata_szymajda/',
    imagesDownloaded: images.length,
    images,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  if (fs.existsSync(sitePath) && images.length) {
    const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'));
    site.scrapedAt = manifest.scrapedAt;
    site.social = site.social ?? {};
    site.social.instagram = {
      url: IG_PROFILE,
      handle: profile.handle,
      description: profile.description ?? site.social.instagram?.description,
      gallery: images.map((i) => i.localPath),
      scrapedImages: images.length,
    };
    site.images = site.images ?? {};
    if (images[0]) site.images.about = images[0].localPath;
    const gallery = new Set(site.images.gallery ?? []);
    for (const img of images) gallery.add(img.localPath);
    site.images.gallery = [...gallery];
    site.atelier?.forEach((item, i) => {
      if (images[i]) item.image = images[i].localPath;
    });
    fs.writeFileSync(sitePath, JSON.stringify(site, null, 2), 'utf8');
    console.log(`Zaktualizowano ${sitePath}`);
  }

  console.log(`\nGotowe: ${images.length} zdjęć → public/images/social/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
