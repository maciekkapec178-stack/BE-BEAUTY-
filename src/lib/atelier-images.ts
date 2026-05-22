export type AtelierImageFrame = {
  objectPosition: string;
  aspectRatio: string;
  /** <1 = oddalenie (więcej kadru widoczne przy object-fit: cover) */
  scale?: number;
};

/** Kadrowanie — tylko pozycja i proporcje karty; zdjęcie wypełnia całość */
export const ATELIER_FRAMES: Record<string, AtelierImageFrame> = {
  brows: {
    objectPosition: 'center 35%',
    aspectRatio: '16/9',
  },
  'pmu-lips': {
    objectPosition: 'center 50%',
    aspectRatio: '16/9',
  },
  cosmetology: {
    objectPosition: 'center 40%',
    aspectRatio: '4/5',
  },
  nails: {
    objectPosition: 'center 45%',
    aspectRatio: '4/5',
  },
  academy: {
    objectPosition: 'center center',
    aspectRatio: '1/1',
  },
};

const LAYOUT_FALLBACK: Record<string, string> = {
  wide: '16/9',
  portrait: '3/4',
  default: '4/5',
};

export function getAtelierFrame(id: string, layout?: string, imageFocus?: string): AtelierImageFrame {
  const base = ATELIER_FRAMES[id] ?? {
    objectPosition: 'center center',
    aspectRatio: LAYOUT_FALLBACK[layout ?? 'default'] ?? LAYOUT_FALLBACK.default,
  };
  if (imageFocus) {
    return { ...base, objectPosition: imageFocus };
  }
  return base;
}
