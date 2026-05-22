/**
 * Galeria — warianty 1200 / 1920 / 2560 px (JPG + WebP).
 * Uruchom: node scripts/optimize-gallery.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const socialDir = path.join(root, 'public', 'images', 'social');
const optDir = path.join(socialDir, 'opt');
const sitePath = path.join(root, 'data', 'site-content.json');

const WIDTHS = [1200, 1920, 2560];

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Zainstaluj sharp: npm i -D sharp');
    process.exit(1);
  }

  const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'));
  const sources = site.images?.gallery ?? [];
  if (!sources.length) {
    console.error('Brak images.gallery w site-content.json');
    process.exit(1);
  }

  fs.mkdirSync(optDir, { recursive: true });

  for (const rel of sources) {
    const srcPath = path.join(root, 'public', rel.replace(/^\//, ''));
    if (!fs.existsSync(srcPath)) {
      console.warn('Pominięto (brak pliku):', rel);
      continue;
    }

    const id = path.basename(rel).replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const meta = await sharp(srcPath).metadata();
    const srcW = meta.width ?? 1200;
    console.log(`\n${id} ← ${srcW}x${meta.height}`);

    for (const w of WIDTHS) {
      const upscale = w > srcW;
      const pipeline = sharp(srcPath)
        .resize({ width: w, withoutEnlargement: false })
        .sharpen({ sigma: upscale ? 0.55 : 0.3, m1: 0.5, m2: 0.25 });

      for (const [ext, quality] of [
        ['jpg', { quality: 92, mozjpeg: true }],
        ['webp', { quality: 88 }],
      ]) {
        const name = `${id}-${w}.${ext}`;
        const out = path.join(optDir, name);
        const tmp = `${out}.tmp`;
        if (ext === 'jpg') {
          await pipeline.clone().jpeg(quality).toFile(tmp);
        } else {
          await pipeline.clone().webp(quality).toFile(tmp);
        }
        fs.renameSync(tmp, out);
        const kb = Math.round(fs.statSync(out).size / 1024);
        console.log(' ', name, `${kb} KB`);
      }
    }
  }

  console.log('\nGotowe → public/images/social/opt/');
}

main();
