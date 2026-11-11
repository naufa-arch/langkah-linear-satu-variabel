"""Membuat ikon PWA (PNG) tanpa pustaka tambahan: lambang timbangan seimbang.

Jalankan dari folder backend:  uv run python scripts/make_icons.py
"""

import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "frontend" / "icons"

BLUE = (0x24, 0x57, 0xC5)
WHITE = (0xFF, 0xFF, 0xFF)
ORANGE = (0xFD, 0xBA, 0x74)


def png(path: Path, size: int, pixels) -> None:
    raw = b"".join(b"\x00" + bytes(c for px in row for c in px) for row in pixels)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    data = b"\x89PNG\r\n\x1a\n"
    data += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    data += chunk(b"IDAT", zlib.compress(raw, 9))
    data += chunk(b"IEND", b"")
    path.write_bytes(data)


def draw(size: int, scale: float):
    """scale < 1 memperkecil lambang agar aman untuk ikon 'maskable' (zona aman 80%)."""
    rows = []
    c = size / 2
    for y in range(size):
        row = []
        for x in range(size):
            u = (x - c) / (size * scale) + 0.5  # koordinat 0..1 di dalam lambang
            v = (y - c) / (size * scale) + 0.5
            col = BLUE
            if 0.14 <= u <= 0.86 and 0.40 <= v <= 0.45:  # lengan timbangan
                col = WHITE
            if 0.475 <= u <= 0.525 and 0.42 <= v <= 0.80:  # tiang
                col = WHITE
            if 0.34 <= u <= 0.66 and 0.78 <= v <= 0.83:  # alas
                col = WHITE
            for px in (0.24, 0.76):  # piringan kiri & kanan
                if abs(u - px) <= 0.14 and 0.30 <= v <= 0.35:
                    col = WHITE
                if abs(u - px) <= 0.018 and 0.33 <= v <= 0.42:
                    col = WHITE
            if (u - 0.24) ** 2 + (v - 0.235) ** 2 <= 0.055**2:  # blok x (kiri)
                col = WHITE
            if abs(u - 0.76) <= 0.05 and 0.19 <= v <= 0.29:  # kubus 1 (kanan)
                col = WHITE
            if (u - 0.5) ** 2 + (v - 0.425) ** 2 <= 0.045**2:  # titik tumpu = tanda "="
                col = ORANGE
            row.append(col)
        rows.append(row)
    return rows


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    png(OUT / "icon-192.png", 192, draw(192, 0.86))
    png(OUT / "icon-512.png", 512, draw(512, 0.86))
    png(OUT / "maskable-512.png", 512, draw(512, 0.66))
    print("Ikon dibuat di", OUT)
