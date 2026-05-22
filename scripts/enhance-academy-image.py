"""Wzmocnienie złotego napisu na środku — edycja pliku, bez nakładek CSS."""
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

PATH = r"f:\archiwum\by bouty\public\images\social\academy-zostan-ekspertem.png"

im = Image.open(PATH).convert("RGB")
w, h = im.size

# Miękka maska: pas na wysokości napisu (BROW ACADEMY + imię)
mask = Image.new("L", (w, h), 0)
draw = ImageDraw.Draw(mask)
cx, cy = w * 0.5, h * 0.545
rx, ry = w * 0.40, h * 0.095
draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(radius=32))

# Wzmocnienie kontrastu, nasycenia i lekkie rozjaśnienie w strefie napisu
enhanced = ImageEnhance.Contrast(im).enhance(1.18)
enhanced = ImageEnhance.Color(enhanced).enhance(1.45)
enhanced = ImageEnhance.Brightness(enhanced).enhance(1.1)
enhanced = enhanced.filter(ImageFilter.SHARPEN)

# Delikatna warstwa złota w masce
gold = Image.new("RGB", (w, h), (220, 185, 115))
gold_mask = mask.point(lambda p: int(p * 0.28))

result = Image.composite(enhanced, im, mask)
result = Image.composite(gold, result, gold_mask)

result.save(PATH, optimize=True)
print(f"Zapisano: {PATH} ({w}x{h})")
