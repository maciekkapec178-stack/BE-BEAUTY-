/**
 * Pobiera oryginalne zdjęcie Brow Academy z Facebooka (strona / zdjęcia).
 * npm run scrape:academy
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = path.join(root, 'public', 'images', 'social');
const outPath = path.join(imgDir, 'academy-zostan-ekspertem.png');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const PAGES = [
  'https://www.facebook.com/bebeautyluban/photos',
  'https://m.facebook.com/bebeautyluban/photos',
  'https://www.facebook.com/bebeautyluban/?locale=pl_PL',
];

function unescapeUrl(raw) {
  let u = raw;
  while (u.includes('\\/')) u = u.replace('\\/', '/');
  return u.replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
}

function extractImageUrls(html) {
  const urls = new Set();
  for (const m of html.matchAll(/https:\/\/scontent[^\s"'<>\\]+/g)) {
    urls.add(unescapeUrl(m[0]));
  }
  for (const m of html.matchAll(/"uri":"(https:[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)) {
    urls.add(unescapeUrl(m[1]));
  }
  return [...urls].filter((u) => u.includes('scontent') && !u.includes('emoji'));
}

function score(url) {
  let s = 0;
  if (url.includes('p1080') || url.includes('p960') || url.includes('p720x720')) s += 30;
  const w = url.match(/[?&](?:width|w)=(\d+)/i)?.[1];
  if (w) s += Math.min(Number(w) / 50, 40);
  if (url.includes('stp=')) s += 5;
  if (url.includes('s320') || url.includes('p130x130')) s -= 50;
  return s;
}

async function download(url, referer) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Referer: referer, Accept: 'image/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 50000) throw new Error(`too small ${buf.length}`);
  return buf;
}

async function main() {
  fs.mkdirSync(imgDir, { recursive: true });
  let html = '';
  for (const pageUrl of PAGES) {
    try {
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': UA,
          'Accept-Language': 'pl-PL,pl;q=0.9',
          Accept: 'text/html',
        },
        redirect: 'follow',
      });
      const text = await res.text();
      if (text.length > html.length) html = text;
      console.log('fetch', pageUrl, res.status, text.length);
    } catch (e) {
      console.warn('fail', pageUrl, e.message);
    }
  }

  const rawPath = path.join(root, 'facebook-academy-raw.html');
  fs.writeFileSync(rawPath, html);
  const candidates = extractImageUrls(html).sort((a, b) => score(b) - score(a));
  console.log('candidates', candidates.length);
  candidates.slice(0, 8).forEach((u, i) => console.log(i, score(u), u.slice(0, 100)));

  for (const url of candidates) {
    try {
      const buf = await download(url, PAGES[0]);
      fs.writeFileSync(outPath, buf);
      console.log('saved', outPath, buf.length);
      return;
    } catch (e) {
      console.warn('dl fail', e.message);
    }
  }

  console.error('Brak zdjęcia — sprawdź facebook-academy-raw.html');
  process.exit(1);
}

main();
