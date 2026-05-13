"""Build favicon-32.png and apple-touch-icon.png from assets/site-icon-source.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "site-icon-source.png"


def content_bbox(im: Image.Image, lum_cut: int = 42, rgb_sum_cut: int = 48) -> tuple[int, int, int, int]:
    """Bounding box of pixels that are not near-black background."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 25:
                continue
            lum = (r * 299 + g * 587 + b * 114) // 1000
            s = r + g + b
            if lum <= lum_cut and s <= rgb_sum_cut and max(r, g, b) < 58:
                continue
            found = True
            minx = min(minx, x)
            miny = min(miny, y)
            maxx = max(maxx, x)
            maxy = max(maxy, y)
    if not found:
        return 0, 0, w - 1, h - 1
    return minx, miny, maxx, maxy


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    minx, miny, maxx, maxy = content_bbox(im)
    sub = im.crop((minx, miny, maxx + 1, maxy + 1))
    cw, ch = sub.size
    side = max(cw, ch)
    pad = max(6, int(side * 0.08))
    sq = side + 2 * pad
    # Dark square matches site chrome; keeps VCH readable on light browser UI
    bg = (18, 16, 14, 255)
    sq_im = Image.new("RGBA", (sq, sq), bg)
    ox = (sq - cw) // 2
    oy = (sq - ch) // 2
    sq_im.paste(sub, (ox, oy), sub)

    sq_im.resize((32, 32), Image.Resampling.LANCZOS).save(ROOT / "assets" / "favicon-32.png", optimize=True)
    sq_im.resize((180, 180), Image.Resampling.LANCZOS).save(ROOT / "assets" / "apple-touch-icon.png", optimize=True)
    print("favicon from", SRC.name, "square", sq, "-> favicon-32.png, apple-touch-icon.png")


if __name__ == "__main__":
    main()
