"""Penghubung ke penyedia AI. Kunci API hanya dibaca di sini (server), tidak pernah dikirim ke HP.

- DeepSeek (utama): API kompatibel OpenAI, {DEEPSEEK_BASE_URL}/chat/completions
- Gemini (cadangan): dipakai otomatis bila DEEPSEEK_API_KEY kosong tetapi GEMINI_API_KEY terisi.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass

import httpx

from app.config import Settings

GEMINI_FALLBACKS = ("gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-flash-latest")


class AIUnavailable(RuntimeError):
    """Tidak ada kunci API yang terpasang."""


class AIError(RuntimeError):
    """Penyedia AI gagal menjawab (jaringan, kunci salah, kuota habis, dll.)."""


@dataclass
class Provider:
    name: str
    model: str


def active_provider(s: Settings) -> Provider | None:
    want = s.ai_provider.lower().strip()
    if want in ("auto", "deepseek") and s.deepseek_api_key.strip():
        return Provider("deepseek", s.deepseek_model)
    if want in ("auto", "gemini") and s.gemini_api_key.strip():
        return Provider("gemini", s.gemini_model)
    return None


def _error_message(res: httpx.Response) -> str:
    code = res.status_code
    if code in (401, 403):
        return "Kunci API ditolak penyedia AI (periksa kunci di .env)."
    if code == 402:
        return "Saldo/kuota akun AI habis."
    if code == 429:
        return "Terlalu banyak permintaan ke AI. Tunggu sebentar."
    return f"Penyedia AI mengembalikan kode {code}."


async def chat(
    s: Settings,
    system: str,
    messages: list[dict[str, str]],
    *,
    json_mode: bool = False,
    temperature: float = 0.5,
    max_tokens: int = 700,
) -> tuple[str, Provider]:
    """Kirim percakapan. `messages` berisi {"role": "user"|"assistant", "content": str}."""
    p = active_provider(s)
    if p is None:
        raise AIUnavailable(
            "Belum ada kunci AI. Isi DEEPSEEK_API_KEY (atau GEMINI_API_KEY) di .env."
        )
    try:
        async with httpx.AsyncClient(timeout=s.ai_timeout_seconds) as http:
            if p.name == "deepseek":
                text = await _deepseek(
                    http, s, system, messages, json_mode, temperature, max_tokens
                )
            else:
                text = await _gemini(http, s, system, messages, json_mode, temperature, max_tokens)
    except httpx.TimeoutException as e:
        raise AIError("AI terlalu lama menjawab. Coba lagi.") from e
    except httpx.HTTPError as e:
        raise AIError("Server tidak bisa menghubungi penyedia AI.") from e
    text = (text or "").strip()
    if not text:
        raise AIError("AI tidak memberi jawaban. Coba ulangi pertanyaannya.")
    return text, p


async def _deepseek(http, s, system, messages, json_mode, temperature, max_tokens) -> str:
    body = {
        "model": s.deepseek_model,
        "messages": [{"role": "system", "content": system}, *messages],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    res = await http.post(
        s.deepseek_base_url.rstrip("/") + "/chat/completions",
        headers={"Authorization": f"Bearer {s.deepseek_api_key.strip()}"},
        json=body,
    )
    if res.status_code != 200:
        raise AIError(_error_message(res))
    return res.json()["choices"][0]["message"]["content"]


async def _gemini(http, s, system, messages, json_mode, temperature, max_tokens) -> str:
    contents = [
        {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
        for m in messages
    ]
    config: dict = {"temperature": temperature, "maxOutputTokens": max_tokens}
    if json_mode:
        config["responseMimeType"] = "application/json"
    body = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": contents,
        "generationConfig": config,
    }
    # Google sering mengganti/membatasi model. Bila model utama 404 (dihentikan) atau 503 (sibuk),
    # coba model cadangan secara berurutan.
    models = list(dict.fromkeys([s.gemini_model, *GEMINI_FALLBACKS]))
    res = None
    for model in models:
        try:
            res = await http.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                headers={"x-goog-api-key": s.gemini_api_key.strip()},
                json=body,
                timeout=min(s.ai_timeout_seconds, 25.0),
            )
        except httpx.TimeoutException:
            continue
        if res.status_code not in (404, 500, 503):
            break
    if res is None:
        raise AIError("AI terlalu lama menjawab. Coba lagi.")
    if res.status_code != 200:
        raise AIError(_error_message(res))
    data = res.json()
    try:
        parts = data["candidates"][0]["content"]["parts"]
    except (KeyError, IndexError) as e:
        raise AIError("AI menolak atau tidak menjawab pertanyaan ini.") from e
    return "".join(part.get("text", "") for part in parts)


def parse_json(text: str) -> dict:
    """Ambil objek JSON dari balasan AI (kadang dibungkus ```json ... ```)."""
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        raise AIError("Format jawaban AI tidak dikenali.")
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError as e:
        raise AIError("Format jawaban AI tidak dikenali.") from e
