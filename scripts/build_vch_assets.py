"""Build assets/vch-mark.png + favicons from current vch-mark (re-tighten + pad). Run from repo root."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "vch-mark.png"


def bright_bbox(im: Image.Image, thresh: int = 18) -> tuple[int, int, int, int]:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 40:
                continue
            if r + g + b <= thresh * 3:
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
    minx, miny, maxx, maxy = bright_bbox(im)
    sub = im.crop((minx, miny, maxx + 1, maxy + 1))
    cw, ch = sub.size

    # Header mark: small left pad, modest right pad (~one word-space at scale), generous top/bottom (less aggressive crop)
    pl = max(2, int(cw * 0.012))
    pr = max(8, int(cw * 0.028))
    pt = max(14, int(ch * 0.13))
    pb = max(14, int(ch * 0.13))

    out_w = cw + pl + pr
    out_h = ch + pt + pb
    header_img = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    header_img.paste(sub, (pl, pt), sub)
    header_img.save(ROOT / "assets" / "vch-mark.png", optimize=True)

    # Favicon: square with extra air so the mark stays visually centered (gentle crop)
    iw, ih = header_img.size
    sq = max(iw, ih)
    margin = max(18, int(sq * 0.2))
    sq2 = sq + 2 * margin
    sq_im = Image.new("RGBA", (sq2, sq2), (0, 0, 0, 0))
    ox = (sq2 - iw) // 2
    oy = (sq2 - ih) // 2
    sq_im.paste(header_img, (ox, oy), header_img)

    sq_im.resize((32, 32), Image.Resampling.LANCZOS).save(ROOT / "assets" / "favicon-32.png", optimize=True)
    sq_im.resize((180, 180), Image.Resampling.LANCZOS).save(ROOT / "assets" / "apple-touch-icon.png", optimize=True)

    print("vch-mark", header_img.size, "favicon square", sq2)


if __name__ == "__main__":
    main()
