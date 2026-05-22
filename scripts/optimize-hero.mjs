/**
 * Kompresja hero — uruchom: node scripts/optimize-hero.mjs
 * Wymaga: npm i -D sharp
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dir = path.join(root, 'public', 'images', 'social');
const srcCandidates = [
  path.join(dir, 'hero-fb-photo-source.png'),
  path.join(dir, 'hero-fb-photo-source.jpg'),
  path.join(dir, 'hero-fb-photo.jpg'),
];
const src = srcCandidates.find((p) => fs.existsSync(p));

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Zainstaluj sharp: npm i -D sharp');
    process.exit(1);
  }

  if (!src) {
    console.error('Brak pliku źródłowego hero w', dir);
    process.exit(1);
  }

  const meta = await sharp(src).metadata();
  const baseW = meta.width ?? 1024;
  const target2x = Math.min(2560, Math.max(baseW * 2, 1920));

  const outputs = [
    ['hero-fb-photo.jpg', sharp(src).jpeg({ quality: 93, mozjpeg: true })],
    ['hero-fb-photo@2x.jpg', sharp(src).resize({ width: target2x, kernel: 'lanczos3' }).jpeg({ quality: 90, mozjpeg: true })],
    ['hero-fb-photo.webp', sharp(src).webp({ quality: 90 })],
    ['hero-fb-photo@2x.webp', sharp(src).resize({ width: target2x, kernel: 'lanczos3' }).webp({ quality: 88 })],
  ];

  for (const [name, pipeline] of outputs) {
    const out = path.join(dir, name);
    const tmp = `${out}.tmp`;
    await pipeline.toFile(tmp);
    fs.renameSync(tmp, out);
    const m = await sharp(out).metadata();
    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log(name, `${m.width}x${m.height}`, `${kb} KB`);
  }
}

main();
