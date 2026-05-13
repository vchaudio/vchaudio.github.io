"""From assets/vch-mark.png build transparent mark + favicons (dark → alpha).

Requires assets/vch-mark.png (opaque padded letters). Regenerate that first with:
  python scripts/build_vch_assets.py
Then:
  python scripts/build_vch_transparent_assets.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "vch-mark.png"
OUT_MARK = ROOT / "assets" / "vch-mark-transparent.png"


def knock_out_dark(im: Image.Image, lum_cut: int = 46, rgb_sum_cut: int = 52) -> Image.Image:
    """Turn near-black background pixels transparent; keep orange/white letters."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            lum = (r * 299 + g * 587 + b * 114) // 1000
            s = r + g + b
            if lum <= lum_cut and s <= rgb_sum_cut and max(r, g, b) < 62:
                px[x, y] = (0, 0, 0, 0)
    return im


def main() -> None:
    base = Image.open(SRC).convert("RGBA")
    trans = knock_out_dark(base)
    trans.save(OUT_MARK, optimize=True)
    iw, ih = trans.size

    sq = max(iw, ih)
    margin = max(18, int(sq * 0.2))
    sq2 = sq + 2 * margin
    sq_im = Image.new("RGBA", (sq2, sq2), (0, 0, 0, 0))
    ox = (sq2 - iw) // 2
    oy = (sq2 - ih) // 2
    sq_im.paste(trans, (ox, oy), trans)

    sq_im.resize((32, 32), Image.Resampling.LANCZOS).save(ROOT / "assets" / "favicon-32.png", optimize=True)
    sq_im.resize((180, 180), Image.Resampling.LANCZOS).save(ROOT / "assets" / "apple-touch-icon.png", optimize=True)

    print("wrote", OUT_MARK.name, trans.size, "favicon square", sq2)


if __name__ == "__main__":
    main()
