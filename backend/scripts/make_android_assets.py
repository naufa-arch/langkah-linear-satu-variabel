"""Membuat gambar sumber ikon & splash screen Android (folder ../assets) dari lambang timbangan PWA.

Jalankan dari folder backend:  uv run python scripts/make_android_assets.py
Lalu `npm run android:assets` (Capacitor Assets) mengubahnya ke semua ukuran Android.
"""

import struct
import zlib
from pathlib import Path

from make_icons import BLUE, draw

OUT = Path(__file__).resolve().parents[2] / "assets"
DARK = (0x14, 0x16, 0x1A)


def png_rgba(path: Path, w: int, h: int, rows) -> None:
    raw = b"".join(b"\x00" + bytes(c for px in row for c in px) for row in rows)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    data = b"\x89PNG\r\n\x1a\n"
    data += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    data += chunk(b"IDAT", zlib.compress(raw, 9))
    data += chunk(b"IEND", b"")
    path.write_bytes(data)


def logo(size: int, scale: float, transparent: bool):
    """Lambang (RGBA). Bila transparent, latar biru dibuat bening (untuk ikon adaptif)."""
    rows = []
    for row in draw(size, scale):
        rows.append([(*px, 0) if transparent and px == BLUE else (*px, 255) for px in row])
    return rows


def canvas(w: int, h: int, bg, mark, mark_size: int):
    """Latar polos ukuran w×h dengan lambang di tengah (diperbesar tanpa menghaluskan)."""
    rows = [[(*bg, 255)] * w for _ in range(h)]
    msize = len(mark)
    k = mark_size / msize
    x0, y0 = (w - mark_size) // 2, (h - mark_size) // 2
    for y in range(mark_size):
        src = mark[int(y / k)]
        line = rows[y0 + y]
        for x in range(mark_size):
            px = src[int(x / k)]
            if px[3]:
                line[x0 + x] = px
    return rows


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    png_rgba(OUT / "icon-only.png", 1024, 1024, logo(1024, 0.86, transparent=False))
    png_rgba(OUT / "icon-foreground.png", 1024, 1024, logo(1024, 0.62, transparent=True))
    png_rgba(OUT / "icon-background.png", 1024, 1024, [[(*BLUE, 255)] * 1024 for _ in range(1024)])
    mark = logo(256, 0.9, transparent=True)
    png_rgba(OUT / "splash.png", 2048, 2048, canvas(2048, 2048, BLUE, mark, 512))
    png_rgba(OUT / "splash-dark.png", 2048, 2048, canvas(2048, 2048, DARK, mark, 512))
    print("Gambar Android dibuat di", OUT)
