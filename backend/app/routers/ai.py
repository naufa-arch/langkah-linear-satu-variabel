"""Tutor AI (DeepSeek, cadangan Gemini) dengan pendekatan RMT.

Kunci API tidak pernah keluar dari server: HP hanya mengirim pertanyaan ke /api/v1/ai/... dan
menerima teks jawaban.
"""

import time
from collections import defaultdict, deque
from fractions import Fraction
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from app.ai.client import AIError, AIUnavailable, active_provider, chat, parse_json
from app.ai.prompts import RMT_CRITERIA, RMT_STAGES, SOAL_JSON, system_prompt
from app.config import Settings, get_settings

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])
SettingsDep = Annotated[Settings, Depends(get_settings)]

# ---------- pembatas permintaan sederhana (per alamat IP, per menit) ----------
_hits: dict[str, deque[float]] = defaultdict(deque)


def rate_limit(request: Request, s: SettingsDep) -> None:
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (
        request.client.host if request.client else "?"
    )
    q = _hits[ip]
    t = time.monotonic()
    while q and t - q[0] > 60:
        q.popleft()
    if len(q) >= s.ai_requests_per_minute:
        raise HTTPException(
            429, "Terlalu banyak pertanyaan dalam satu menit. Istirahat sebentar, ya."
        )
    q.append(t)


def _ai_http_error(e: Exception) -> HTTPException:
    if isinstance(e, AIUnavailable):
        return HTTPException(503, str(e))
    return HTTPException(502, str(e))


@router.get("/status")
def status(s: SettingsDep) -> dict[str, Any]:
    p = active_provider(s)
    return {
        "available": p is not None,
        "provider": p.name if p else None,
        "model": p.model if p else None,
    }


class Msg(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


Mode = Literal["tanya", "jelaskan", "petunjuk", "analisis", "pembahasan", "rmt"]


class ChatIn(BaseModel):
    mode: Mode = "tanya"
    messages: list[Msg] = Field(min_length=1, max_length=16)
    # konteks dari layar (soal, jawaban siswa, langkah RMT, ...). Hanya teks pendek.
    context: dict[str, str | int] = Field(default_factory=dict)

    @field_validator("context")
    @classmethod
    def _ctx(cls, v: dict) -> dict:
        if len(v) > 12 or any(len(str(x)) > 1500 for x in v.values()):
            raise ValueError("konteks terlalu besar.")
        return v


def _context_text(mode: str, ctx: dict) -> str:
    if not ctx:
        return ""
    lines = [f"- {k}: {v}" for k, v in ctx.items()]
    if mode == "rmt" and "langkah_rmt" in ctx:
        try:
            n = int(ctx["langkah_rmt"])
            lines.append(f"- nama langkah: {RMT_STAGES[n]}")
            lines.append(f"- kriteria TEPAT untuk langkah ini saja: {RMT_CRITERIA[n]}")
        except (KeyError, ValueError):
            pass
    return "KONTEKS DARI APLIKASI (bukan dari siswa):\n" + "\n".join(lines)


@router.post("/chat", dependencies=[Depends(rate_limit)])
async def ai_chat(body: ChatIn, s: SettingsDep) -> dict[str, Any]:
    system = system_prompt(body.mode)
    ctx = _context_text(body.mode, body.context)
    if ctx:
        system += "\n\n" + ctx
    msgs = [m.model_dump() for m in body.messages]
    try:
        text, p = await chat(s, system, msgs)
    except (AIUnavailable, AIError) as e:
        raise _ai_http_error(e) from e
    out: dict[str, Any] = {"reply": text, "provider": p.name}
    if body.mode == "rmt":
        out["status"] = "tepat" if "STATUS: TEPAT" in text.upper() else "perbaiki"
        out["reply"] = "\n".join(
            ln for ln in text.splitlines() if not ln.strip().upper().startswith("STATUS:")
        ).strip()
    return out


class SoalIn(BaseModel):
    level: Literal["mudah", "sedang", "sulit"] = "sedang"
    jenis: Literal["PLSV", "PtLSV"] = "PLSV"
    fokus: str = Field(default="", max_length=200)


REL_OK = {"PLSV": {"="}, "PtLSV": {"<", ">", "<=", ">="}}
FLIP = {"<": ">", ">": "<", "<=": ">=", ">=": "<=", "=": "="}


def check_generated(d: dict, jenis: str) -> dict[str, Any]:
    """Periksa soal buatan AI dan hitung jawabannya SENDIRI (jawaban tidak diambil dari AI)."""
    try:
        a, b, c = int(d["a"]), int(d["b"]), int(d["c"])
        rel = str(d["rel"]).replace("≤", "<=").replace("≥", ">=")
        cerita, tanya = str(d["cerita"]).strip(), str(d["pertanyaan"]).strip()
    except (KeyError, TypeError, ValueError) as e:
        raise AIError("Soal dari AI tidak lengkap.") from e
    if a == 0 or rel not in REL_OK[jenis] or not cerita or not tanya:
        raise AIError("Soal dari AI tidak sesuai aturan.")
    if max(abs(a), abs(b), abs(c)) > 100000:
        raise AIError("Angka pada soal AI terlalu besar.")
    x = Fraction(c - b, a)
    if x.denominator != 1:
        raise AIError("Jawaban soal AI bukan bilangan bulat.")
    final_rel = FLIP[rel] if a < 0 else rel
    return {
        "judul": str(d.get("judul", "Soal cerita")).strip()[:80],
        "cerita": cerita[:900],
        "pertanyaan": tanya[:300],
        "variabel": str(d.get("variabel", "")).strip()[:120],
        "satuan": str(d.get("satuan", "")).strip()[:40],
        "kesimpulan": str(d.get("kesimpulan", "")).strip()[:300],
        "problem": {"left": {"a": a, "b": b}, "rel": rel, "right": {"a": 0, "b": c}, "type": jenis},
        "jawaban": {"rel": final_rel, "value": int(x)},
    }


@router.post("/soal", dependencies=[Depends(rate_limit)])
async def ai_soal(body: SoalIn, s: SettingsDep) -> dict[str, Any]:
    """Buat soal cerita sesuai tingkat siswa. Dicoba sampai 3 kali bila hasil AI tidak sah."""
    prompt = SOAL_JSON.format(
        level=body.level,
        jenis="Persamaan Linear Satu Variabel (PLSV)"
        if body.jenis == "PLSV"
        else "Pertidaksamaan Linear Satu Variabel (PtLSV)",
        fokus=body.fokus or "-",
    )
    last: Exception | None = None
    for _ in range(3):
        try:
            text, p = await chat(
                s,
                "Kamu penulis soal matematika SMP. Patuhi format JSON dengan tepat.",
                [{"role": "user", "content": prompt}],
                json_mode=True,
                temperature=0.9,
                max_tokens=700,
            )
            soal = check_generated(parse_json(text), body.jenis)
            soal["provider"] = p.name
            return soal
        except AIUnavailable as e:
            raise _ai_http_error(e) from e
        except AIError as e:
            last = e
    raise _ai_http_error(last or AIError("Gagal membuat soal."))
