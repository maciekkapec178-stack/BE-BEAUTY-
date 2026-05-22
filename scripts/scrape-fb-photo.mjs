import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PHOTO_URL =
  'https://www.facebook.com/photo/?fbid=1128494332616053&set=a.471661001632726&locale=pl_PL';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const imgDir = path.join(root, 'public', 'images', 'social');
const outHero = path.join(imgDir, 'hero-fb-photo.png');

function unescapeUrl(raw) {
  let u = raw;
  while (u.includes('\\/')) u = u.replace('\\/', '/');
  return u.replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
}

function extractImageUrls(html) {
  const urls = new Set();

  for (const m of html.matchAll(
    /<link rel="preload" href="(https:\/\/scontent[^"]+)" as="image" data-preloader="adp_CometPhotoRootContentQueryRelayPreloader/gi,
  )) {
    urls.add(unescapeUrl(m[1].replace(/&amp;/g, '&')));
  }

  for (const m of html.matchAll(/property="og:image"\s+content="([^"]+)"/gi)) {
    urls.add(unescapeUrl(m[1]));
  }
  for (const m of html.matchAll(/"og:image":"([^"]+)"/g)) {
    urls.add(unescapeUrl(m[1]));
  }
  for (const m of html.matchAll(/"uri":"(https:[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)) {
    const u = unescapeUrl(m[1]);
    if (u.includes('scontent') || u.includes('fbcdn')) urls.add(u);
  }
  for (const m of html.matchAll(/https?:\\?\/\\?\/scontent[^"\\]+/g)) {
    urls.add(unescapeUrl(m[0]));
  }
  for (const m of html.matchAll(/https:\/\/scontent[^\s"'<>\\]+/g)) {
    urls.add(unescapeUrl(m[0]));
  }
  for (const m of html.matchAll(/https:\/\/[^"'\s<>]*fbcdn\.net[^"'\s<>]*/g)) {
    urls.add(unescapeUrl(m[0]));
  }

  return [...urls].filter((u) => /\.(jpe?g|png|webp)/i.test(u) || u.includes('stp='));
}

function scoreUrl(url) {
  let s = 0;
  if (url.includes('1128494332616053')) s += 50;
  if (url.includes('scontent')) s += 10;
  if (url.includes('p720x720') || url.includes('p960x960') || url.includes('p1080')) s += 20;
  if (url.includes('p526x395') || url.includes('p320x320')) s -= 5;
  const w = url.match(/[?&](?:width|w)=(\d+)/i)?.[1];
  if (w) s += Math.min(Number(w) / 100, 30);
  if (url.includes('logo') || url.includes('emoji')) s -= 100;
  return s;
}

async function download(url, referer) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Referer: referer, Accept: 'image/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8000) throw new Error(`too small ${buf.length}`);
  return buf;
}

async function main() {
  fs.mkdirSync(imgDir, { recursive: true });

  const urlsToTry = [
    PHOTO_URL,
    'https://m.facebook.com/photo.php?fbid=1128494332616053',
    'https://mbasic.facebook.com/photo.php?fbid=1128494332616053',
  ];

  let html = '';
  for (const pageUrl of urlsToTry) {
    try {
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': UA,
          'Accept-Language': 'pl-PL,pl;q=0.9',
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });
      const text = await res.text();
      if (text.length > html.length) html = text;
      console.log('fetch', pageUrl, res.status, text.length);
    } catch (e) {
      console.warn('fetch fail', pageUrl, e.message);
    }
  }

  fs.writeFileSync(path.join(root, 'facebook-photo-raw.html'), html);
  const candidates = extractImageUrls(html).sort((a, b) => scoreUrl(b) - scoreUrl(a));
  console.log('candidates', candidates.length);
  candidates.slice(0, 5).forEach((u, i) => console.log(i, scoreUrl(u), u.slice(0, 120)));

  for (const url of candidates) {
    try {
      const buf = await download(url, PHOTO_URL);
      fs.writeFileSync(outHero, buf);
      console.log('saved', outHero, buf.length, 'bytes');
      console.log('source', url.slice(0, 160));

      const sitePath = path.join(root, 'data', 'site-content.json');
      const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'));
      const heroPath = '/images/social/hero-fb-photo.png';
      site.images.hero = heroPath;
      site.images.heroSource = PHOTO_URL;
      if (!site.images.gallery.includes(heroPath)) {
        site.images.gallery = [heroPath, ...site.images.gallery.filter((p) => p !== heroPath)];
      }
      site.scrapedAt = new Date().toISOString();
      fs.writeFileSync(sitePath, JSON.stringify(site, null, 2) + '\n');
      console.log('updated site-content.json hero ->', heroPath);
      return;
    } catch (e) {
      console.warn('download fail', e.message);
    }
  }

  console.error('No image downloaded. Save photo manually to public/images/social/hero-fb-photo.png');
  process.exit(1);
}

main();
