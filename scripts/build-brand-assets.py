"""One-off script: generate every sized asset the app needs from the two
source logo PNGs in the project root. Not part of any build step, re-run
manually if the source logos change.
"""
from PIL import Image
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LETTER = os.path.join(ROOT, "directify_letter_logo.png")
WORD = os.path.join(ROOT, "directify_fullword_logo.png")


def trim(im: Image.Image) -> Image.Image:
    """Crop to the opaque bounding box so the mark isn't sitting in a huge padded canvas."""
    alpha = im.getchannel("A")
    bbox = alpha.getbbox()
    return im.crop(bbox) if bbox else im


def square(im: Image.Image, padding_pct: float = 0.12) -> Image.Image:
    """Center the mark on a transparent square canvas (correct for icon use —
    a direct non-uniform resize to NxN would squash a non-square mark)."""
    w, h = im.size
    side = round(max(w, h) * (1 + padding_pct))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - w) // 2, (side - h) // 2), im)
    return canvas


letter = square(trim(Image.open(LETTER).convert("RGBA")))
word = trim(Image.open(WORD).convert("RGBA"))

# --- Windows .ico for electron-builder (win.icon) ---
ico_sizes = [16, 24, 32, 48, 64, 128, 256]
os.makedirs(os.path.join(ROOT, "apps/desktop/build"), exist_ok=True)
letter.save(
    os.path.join(ROOT, "apps/desktop/build/icon.ico"),
    sizes=[(s, s) for s in ico_sizes],
)

# --- Runtime BrowserWindow icon (dev + packaged, via resources/) ---
os.makedirs(os.path.join(ROOT, "apps/desktop/resources"), exist_ok=True)
letter.resize((256, 256), Image.LANCZOS).save(os.path.join(ROOT, "apps/desktop/resources/icon.png"))

# --- Desktop renderer: wordmark for the sidebar, letter mark if ever needed ---
brand_dir = os.path.join(ROOT, "apps/desktop/src/renderer/src/assets/brand")
os.makedirs(brand_dir, exist_ok=True)
word_w, word_h = word.size
word.resize((900, round(900 * word_h / word_w)), Image.LANCZOS).save(
    os.path.join(brand_dir, "wordmark.png")
)
letter.resize((256, 256), Image.LANCZOS).save(os.path.join(brand_dir, "mark.png"))

print("done")
print("letter logo bbox size:", letter.size)
print("wordmark bbox size:", word.size)
