const WIDTHS = [1200, 1920, 2560] as const;

export function galleryImageId(src: string): string {
  return src.split('/').pop()?.replace(/\.(jpg|jpeg|png|webp)$/i, '') ?? 'image';
}

export function galleryOptimizedBase(src: string): string {
  return `/images/social/opt/${galleryImageId(src)}`;
}

function variantSrcSet(src: string, ext: 'jpg' | 'webp'): string {
  const base = galleryOptimizedBase(src);
  return WIDTHS.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ');
}

export function buildGalleryWebpSrcSet(src: string): string {
  return variantSrcSet(src, 'webp');
}

export function buildGalleryJpgSrcSet(src: string): string {
  return variantSrcSet(src, 'jpg');
}

/** Zawsze oryginał — opt tylko w srcset gdy wygenerowane (sharp). */
export function galleryDefaultSrc(src: string): string {
  return src;
}

export function galleryLightboxSrc(src: string): string {
  return src;
}

export function galleryLightboxWebp(src: string): string {
  return src.replace(/\.(jpe?g|png)$/i, '.webp');
}

export const GALLERY_SIZES_HERO =
  '(max-width: 700px) 100vw, (max-width: 1200px) 100vw, min(1600px, 96vw)';

export const GALLERY_SIZES_TILE =
  '(max-width: 700px) 100vw, (max-width: 1200px) 50vw, min(780px, 48vw)';
