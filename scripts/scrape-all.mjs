import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = path.join(root, 'public', 'images', 'social');
const outPath = path.join(root, 'data', 'site-content.json');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const LINKS = {
  booksy: 'https://booksy.com/pl-pl/102760_be-beauty-salon-urody-brow-academy-malgorzata-szymajda_salon-kosmetyczny_15570_luban',
  booksyBusinessId: '102760',
  facebook: 'https://www.facebook.com/bebeautyluban/?locale=pl_PL',
  instagram: 'https://www.instagram.com/malgorzata_szymajda/',
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readHtml(name) {
  const p = path.join(root, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function unescapeUrl(raw) {
  let u = raw;
  while (u.includes('\\/')) u = u.replace('\\/', '/');
  return u.replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
}

function extractInstagramPostUrls(html) {
  const urls = [];
  let pos = 0;
  while ((pos = html.indexOf('display_url', pos)) !== -1) {
    const chunk = html.slice(pos, pos + 900);
    const start = chunk.indexOf('https');
    if (start === -1) {
      pos += 11;
      continue;
    }
    const end = chunk.indexOf('"', start + 10);
    const raw = chunk.slice(start, end > start ? end : start + 600);
    const u = unescapeUrl(raw);
    if ((u.includes('cdninstagram') || u.includes('scontent')) && u.includes('jpg')) {
      urls.push(u);
    }
    pos += 11;
  }
  return [...new Set(urls)];
}

function extractCloudfrontUrls(html) {
  const urls = new Set();
  for (const m of html.matchAll(/https:\/\/d375139ucebi94\.cloudfront\.net\/[^"'\\s<>]+\.(?:jpe?g|png|webp)/gi)) {
    urls.add(m[0]);
  }
  return [...urls];
}

function extractOg(html, prop) {
  const m = html.match(new RegExp(`property="${prop}"\\s+content="([^"]+)"`, 'i'));
  return m ? m[1].replace(/&amp;/g, '&').replace(/&#x142;/g, 'ł').replace(/&quot;/g, '"') : null;
}

function extractReviewsFromBooksyHtml(html) {
  const reviews = [];
  const chunks = html.split('data-testid="review-item"').slice(1, 12);
  for (const chunk of chunks) {
    const author = chunk.match(/data-testid="review-author"[\s\S]*?>([^<]+)</)?.[1]?.trim();
    const body = chunk.match(/data-testid="review-body"[\s\S]*?>([^<]+)</)?.[1]?.trim();
    const service = chunk.match(/data-testid="review-service"[\s\S]*?>([^<]+)</)?.[1]?.trim();
    if (author && body) reviews.push({ author, service: service ?? null, body });
  }
  return reviews;
}

const DAY_PL = {
  Monday: 'Poniedziałek',
  Tuesday: 'Wtorek',
  Wednesday: 'Środa',
  Thursday: 'Czwartek',
  Friday: 'Piątek',
  Saturday: 'Sobota',
  Sunday: 'Niedziela',
};

function formatHours(specs) {
  if (!specs?.length) return [];
  return specs.map((spec) => ({
    day: (spec.dayOfWeek || []).map((d) => DAY_PL[d] ?? d).join(', '),
    hours: `${spec.opens} – ${spec.closes}`,
  }));
}

async function download(url, filename, referer) {
  const filepath = path.join(imgDir, filename);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: referer, Accept: 'image/*' },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 4000) return null;
    fs.writeFileSync(filepath, buf);
    return { localPath: `/images/social/${filename}`, originalUrl: url, bytes: buf.length };
  } catch {
    return null;
  }
}

async function scrapeFacebookHero() {
  const { spawn } = await import('node:child_process');
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['scripts/scrape-fb-photo.mjs'], {
      cwd: root,
      stdio: 'inherit',
    });
    child.on('close', (code) => {
      if (code !== 0) console.warn('scrape-fb-photo: brak hero z FB, używany poprzedni plik');
      resolve();
    });
  });
}

async function main() {
  fs.mkdirSync(imgDir, { recursive: true });
  await scrapeFacebookHero();

  const booksy = readJson(path.join(root, 'data', 'booksy-scrape.json'));
  const booksyHtml = readHtml('booksy-raw.html');
  const fbHtml = readHtml('facebook-raw.html');
  const igHtml = readHtml('cache-instagram-embed.html');

  const imageCandidates = [];

  if (booksy.business?.image) imageCandidates.push({ url: booksy.business.image, tag: 'hero', referer: LINKS.booksy });
  if (booksy.business?.logo) imageCandidates.push({ url: booksy.business.logo, tag: 'logo', referer: LINKS.booksy });

  for (const url of extractCloudfrontUrls(booksyHtml)) {
    if (url.includes('service_photos')) imageCandidates.push({ url, tag: 'service', referer: LINKS.booksy });
  }

  const igPosts = extractInstagramPostUrls(igHtml);
  igPosts.forEach((url, i) => imageCandidates.push({ url, tag: `ig-${i}`, referer: LINKS.instagram }));

  const fbOg = extractOg(fbHtml, 'og:image');
  if (fbOg) imageCandidates.push({ url: fbOg, tag: 'fb-profile', referer: LINKS.facebook });

  const seen = new Set();
  const images = {};
  let idx = 0;
  for (const c of imageCandidates) {
    const key = c.url.split('?')[0];
    if (seen.has(key)) continue;
    seen.add(key);
    const ext = c.url.includes('.png') ? 'png' : 'jpg';
    const saved = await download(c.url, `${c.tag}-${String(++idx).padStart(2, '0')}.${ext}`, c.referer);
    if (saved) {
      images[c.tag] = saved;
      console.log('img', c.tag, saved.localPath);
    }
  }

  const reviews =
    booksy.reviewsSample?.length > 0
      ? booksy.reviewsSample.map((r) => ({
          author: r.author,
          body: r.body,
          service: r.service ?? null,
          staff: r.staff ?? 'Małgorzata Szymajda-Drożdżewska',
        }))
      : extractReviewsFromBooksyHtml(booksyHtml);

  const fbDescription = extractOg(fbHtml, 'og:description');

  const site = {
    scrapedAt: new Date().toISOString(),
    brand: {
      name: 'BE BEAUTY',
      legalName: booksy.business.name,
      tagline: 'Gdzie nauka spotyka piękno',
      owner: 'Małgorzata Szymajda',
    },
    description:
      booksy.business.description?.replace(/\r\n/g, ' ').trim() ||
      'Salon urody w Lubaniu. Zabiegi pielęgnacyjne, stylizacja brwi i rzęs, manicure, kosmetologia oraz Brow Academy.',
    links: LINKS,
    contact: {
      phone: '+48 570 520 195',
      email: 'bebeautyluban@gmail.com',
      address: {
        street: 'Fabryczna Osiedle 8/3',
        city: 'Lubań',
        postalCode: '59-800',
        country: 'PL',
        full: 'Fabryczna Osiedle 8/3, 59-800 Lubań',
      },
      geo: booksy.business.geo,
    },
    social: {
      facebook: {
        url: LINKS.facebook,
        followers: 3200,
        description: fbDescription,
      },
      instagram: {
        url: LINKS.instagram,
        handle: '@malgorzata_szymajda',
      },
    },
    booksy: {
      url: LINKS.booksy,
      businessId: LINKS.booksyBusinessId,
      rating: booksy.business.rating,
      priceRange: booksy.business.priceRange,
      amenities: booksy.amenities,
      openingHours: formatHours(booksy.business.openingHours),
      categories: booksy.categories,
      servicesCount: booksy.servicesCount,
      popularServices: booksy.categories.find((c) => c.name === 'Popularne usługi')?.services ?? [],
    },
    reviews: reviews.slice(0, 10),
    stats: [
      { value: '10+', label: 'Lat doświadczenia' },
      { value: String(booksy.business.rating?.value ?? '5.0'), label: `Ocena Booksy (${booksy.business.rating?.count ?? 119})` },
      { value: '1000+', label: 'Zadowolonych klientek' },
      { value: String(booksy.servicesCount ?? 93), label: 'Usług w ofercie' },
    ],
    images: {
      hero:
        (() => {
          try {
            const prev = readJson(outPath);
            if (prev.images?.hero?.includes('hero-fb-photo')) return prev.images.hero;
          } catch {
            /* brak poprzedniego pliku */
          }
          return images.hero?.localPath ?? images['ig-0']?.localPath ?? '/images/social/hero-01.jpg';
        })(),
      heroSource:
        'https://www.facebook.com/photo/?fbid=1128494332616053&set=a.471661001632726&locale=pl_PL',
      logo: images.logo?.localPath ?? null,
      about: images['ig-0']?.localPath ?? images.hero?.localPath ?? null,
      gallery: (() => {
        const paths = Object.values(images).map((i) => i.localPath);
        try {
          const prev = readJson(outPath);
          const hero = prev.images?.hero;
          if (hero && !paths.includes(hero)) paths.unshift(hero);
        } catch {
          /* ignore */
        }
        return paths;
      })(),
    },
    atelier: [
      {
        id: 'brows',
        title: 'Projektowanie Spojrzenia',
        tag: 'PMU · LASHES · BROWS',
        description: 'Geometria brwi, laminacja i makijaż permanentny — precyzja i naturalny efekt.',
        image: images['ig-0']?.localPath ?? images.hero?.localPath,
        categories: ['STYLIZACJA BRWI', 'STYLIZACJA RZĘS', 'MAKIJAŻ PERMANENTNY', 'BROWBER Męska stylizacja brwi i zarostu'],
      },
      {
        id: 'cosmetology',
        title: 'Zaawansowana Terapia',
        tag: 'GENEO · LARENS · DermaPen',
        description: 'Zabiegi kosmetologiczne na twarz i ciało — m.in. Larens, Geneo, mezoterapia, peelingi.',
        image: images['service-01']?.localPath ?? images.hero?.localPath,
        categories: ['ZABIEGI PIELĘGNACYJNE LARENS', 'GENEO innowacyjna pielęgnacja twarzy', 'MEZOTERAPIA MIKROIGŁOWA DermaPen'],
      },
      {
        id: 'nails',
        title: 'Estetyka Dłoni',
        tag: 'MANICURE · PEDICURE · YOKABA',
        description: 'Manicure hybrydowy i żelowy, SPA pedicure, laminacja paznokci Yokaba.',
        image: images['service-02']?.localPath ?? images['service-01']?.localPath ?? images.hero?.localPath,
        categories: ['STYLIZACJA PAZNOKCI', 'PEDICURE'],
      },
      {
        id: 'academy',
        title: 'Brow Academy',
        tag: 'SZKOLENIA · CERTYFIKATY',
        description: 'Szkolenia stacjonarne i online ze stylizacji brwi, w tym technika AIRBRUSH.',
        image: images['ig-1']?.localPath ?? images.logo?.localPath ?? images.hero?.localPath,
        categories: ['Brow Academy'],
      },
    ],
    academy: {
      title: 'Brow Academy',
      description:
        'Szkolenia z zakresu stylizacji brwi i PMU — kursy, które realnie zmieniają karierę. Stacjonarnie i online.',
    },
  };

  fs.writeFileSync(outPath, JSON.stringify(site, null, 2), 'utf8');
  console.log(`\nZapisano ${outPath}`);
  console.log(`Zdjęć: ${site.images.gallery.length}`);
}

main();
