"""Usuwa złoty kolor z collage (w tym napisu) — edycja pliku PNG."""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

PATH = r"f:\archiwum\by bouty\public\images\social\academy-zostan-ekspertem.png"

im = Image.open(PATH).convert("RGB")
arr = np.array(im, dtype=np.float32)
h, w = arr.shape[:2]

r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]

# Maska środka — napis BROW ACADEMY + imię
yy, xx = np.mgrid[0:h, 0:w]
cx, cy = w * 0.5, h * 0.54
center = ((xx - cx) / (w * 0.38)) ** 2 + ((yy - cy) / (h * 0.14)) ** 2 <= 1.0

# Piksele „złote” (napis + połysk z edycji)
gold = (
    center
    & (r > 130)
    & (g > 95)
    & (b < 155)
    & (r - b > 28)
    & (g - b > 8)
)

# Napis → jasny neutralny (nie złoty)
arr[gold, 0] = np.clip(arr[gold, 0] * 0.25 + 235, 0, 255)
arr[gold, 1] = np.clip(arr[gold, 1] * 0.25 + 233, 0, 255)
arr[gold, 2] = np.clip(arr[gold, 2] * 0.25 + 231, 0, 255)

r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
gray = 0.299 * r + 0.587 * g + 0.114 * b
blend = np.clip((r - b) / 65, 0, 0.6)[..., np.newaxis]
arr = arr * (1 - blend * 0.5) + np.stack([gray, gray, gray], axis=-1) * (blend * 0.5)

out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
out = ImageEnhance.Color(out).enhance(0.72)
out = ImageEnhance.Contrast(out).enhance(1.06)
out = out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=80, threshold=3))

out.save(PATH, optimize=True)
print(f"Zapisano (bez złota): {PATH}")
