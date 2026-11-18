"""Instrumen Mathematical Literacy.

Kunci & rubrik HANYA di server; tidak dikirim ke HP saat tes. Berkasnya TIDAK di-commit ke Git
(repo publik), jadi dicari berurutan di:
  1. INSTRUMEN_LITERASI_PATH (variabel lingkungan, bila diisi)
  2. backend/app/data/instrumen_literasi.json   (laptop)
  3. /etc/secrets/instrumen_literasi.json        (Render → Environment → Secret Files)
"""

import json
import os
from functools import lru_cache
from pathlib import Path

PATH = Path(__file__).resolve().parent / "data" / "instrumen_literasi.json"
SECRET_PATH = Path("/etc/secrets/instrumen_literasi.json")
TEST_KINDS = ("pretest", "posttest", "latihan")


class InstrumentMissing(RuntimeError):
    """Berkas kunci instrumen belum dipasang di server."""


def _candidates() -> list[Path]:
    env = os.environ.get("INSTRUMEN_LITERASI_PATH", "").strip()
    return ([Path(env)] if env else []) + [PATH, SECRET_PATH]


@lru_cache
def instrument() -> dict:
    for p in _candidates():
        if p.is_file():
            return json.loads(p.read_text(encoding="utf-8"))
    raise InstrumentMissing(
        "Kunci instrumen literasi belum dipasang di server. Unggah instrumen_literasi.json "
        "(lihat docs/DEPLOY.md)."
    )


def max_scores() -> dict[str, list[int]]:
    return {s["id"]: [t["skor_maks"] for t in s["tahap"]] for s in instrument()["soal"]}


def max_total() -> int:
    return sum(sum(v) for v in max_scores().values())


def public_items() -> list[dict]:
    """Soal tanpa kunci jawaban (bentuk yang sama dengan frontend/src/content/literasi.js)."""
    return [
        {
            "id": s["id"],
            "indikator": s["indikator"],
            "judul": s["judul"],
            "stimulus": s["stimulus"],
            "tahap": [
                {"pertanyaan": t["pertanyaan"], "skor_maks": t["skor_maks"]} for t in s["tahap"]
            ],
        }
        for s in instrument()["soal"]
    ]


def validate_scores(scores: dict) -> dict[str, list[int]]:
    """Pastikan skor tiap tahap bilangan bulat 0..maks. Melempar ValueError bila tidak sah."""
    mx = max_scores()
    out: dict[str, list[int]] = {}
    for sid, maxima in mx.items():
        vals = scores.get(sid)
        if vals is None:
            raise ValueError(f"Skor {sid} belum diisi.")
        if len(vals) != len(maxima):
            raise ValueError(f"{sid} harus punya {len(maxima)} skor tahap.")
        clean = []
        for i, (v, m) in enumerate(zip(vals, maxima, strict=True), 1):
            if not isinstance(v, int) or isinstance(v, bool) or not 0 <= v <= m:
                raise ValueError(f"{sid} tahap {i}: skor harus 0 sampai {m}.")
            clean.append(v)
        out[sid] = clean
    extra = set(scores) - set(mx)
    if extra:
        raise ValueError(f"Nomor soal tidak dikenal: {sorted(extra)}")
    return out
