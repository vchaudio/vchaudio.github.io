"""Build WebP carousel previews from assets/studio-photo-{1..5}.png masters."""
from __future__ import annotations

import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
MAX_SIDE = 1000
WEBP_QUALITY = 82


def to_rgb(im: Image.Image) -> Image.Image:
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, (14, 12, 10))
        bg.paste(im, mask=im.split()[3])
        return bg
    return im.convert("RGB")


def main() -> None:
    for n in range(1, 6):
        src = os.path.join(ASSETS, f"studio-photo-{n}.png")
        if not os.path.isfile(src):
            raise SystemExit(f"Missing master: {src}")
        dst_webp = os.path.join(ASSETS, f"studio-photo-{n}-preview.webp")
        im = to_rgb(Image.open(src))
        thumb = im.copy()
        thumb.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
        thumb.save(dst_webp, "WEBP", quality=WEBP_QUALITY, method=6)
        w, h = thumb.size
        print(f"studio-photo-{n}: preview {w}x{h} ({os.path.getsize(dst_webp) // 1024} KB)")


if __name__ == "__main__":
    main()
