"""Tutor AI: kunci tidak bocor, RMT dipakai, soal buatan AI diperiksa server.

AI dipalsukan, jadi tes tidak memakai internet atau kuota.
"""

import json

import pytest
from fastapi.testclient import TestClient

from app.ai import client as ai_client
from app.ai.client import AIError, Provider
from app.ai.prompts import system_prompt
from app.main import app
from app.routers import ai as ai_router
from app.routers.ai import check_generated

client = TestClient(app)


@pytest.fixture
def fake_ai(monkeypatch):
    calls = []

    def install(reply: str | list[str]):
        replies = [reply] if isinstance(reply, str) else list(reply)

        async def fake_chat(s, system, messages, **kw):
            calls.append({"system": system, "messages": messages, **kw})
            return replies.pop(0) if len(replies) > 1 else replies[0], Provider("deepseek", "x")

        monkeypatch.setattr(ai_router, "chat", fake_chat)
        return calls

    return install


def test_status_never_returns_key() -> None:
    res = client.get("/api/v1/ai/status")
    assert res.json()["available"] is True
    assert "kunci-palsu" not in res.text


def test_deepseek_preferred_over_gemini(monkeypatch) -> None:
    from app.config import Settings

    s = Settings(deepseek_api_key="a", gemini_api_key="b", ai_provider="auto")
    assert ai_client.active_provider(s).name == "deepseek"
    s = Settings(deepseek_api_key="", gemini_api_key="b", ai_provider="auto")
    assert ai_client.active_provider(s).name == "gemini"
    s = Settings(deepseek_api_key="", gemini_api_key="", ai_provider="auto")
    assert ai_client.active_provider(s) is None


def test_system_prompt_is_rmt_and_not_answer_giving() -> None:
    p = system_prompt("petunjuk")
    assert "Rigorous Mathematical Thinking" in p
    assert "JANGAN langsung memberi jawaban" in p
    for stage in (
        "Pahami",
        "Kenali konsep",
        "Hubungkan representasi",
        "Bernalar",
        "Selesaikan",
        "Jelaskan",
    ):
        assert stage in p
    assert "Jangan pernah menuliskan nilai x akhir" in p


def test_chat_passes_context_and_mode(fake_ai) -> None:
    calls = fake_ai("Coba lihat ruas kiri dulu. Apa yang diketahui?")
    res = client.post(
        "/api/v1/ai/chat",
        json={
            "mode": "petunjuk",
            "messages": [{"role": "user", "content": "Aku bingung"}],
            "context": {"soal": "2x + 3 = 11", "tingkat_petunjuk": 1},
        },
    )
    assert res.status_code == 200
    assert res.json()["reply"].startswith("Coba lihat")
    assert "2x + 3 = 11" in calls[0]["system"]
    assert "MODE: Petunjuk" in calls[0]["system"]


def test_rmt_mode_reports_status(fake_ai) -> None:
    fake_ai("Bagus, informasinya lengkap.\nApa yang ditanyakan?\nSTATUS: TEPAT")
    res = client.post(
        "/api/v1/ai/chat",
        json={
            "mode": "rmt",
            "messages": [{"role": "user", "content": "Diketahui harga 3 buku 15 ribu"}],
            "context": {"langkah_rmt": 1, "soal": "..."},
        },
    ).json()
    assert res["status"] == "tepat"
    assert "STATUS" not in res["reply"]


def test_chat_rejects_unknown_mode_and_long_messages() -> None:
    msg = [{"role": "user", "content": "x"}]
    assert client.post("/api/v1/ai/chat", json={"mode": "hack", "messages": msg}).status_code == 422
    long = [{"role": "user", "content": "x" * 2001}]
    assert client.post("/api/v1/ai/chat", json={"messages": long}).status_code == 422


def test_generated_problem_answer_is_computed_by_server() -> None:
    d = {"cerita": "c", "pertanyaan": "p", "a": 3, "b": 5, "rel": "=", "c": 20}
    out = check_generated(d, "PLSV")
    assert out["jawaban"] == {"rel": "=", "value": 5}
    # pembagian dengan negatif membalik tanda
    d = {"cerita": "c", "pertanyaan": "p", "a": -2, "b": 4, "rel": "<=", "c": -6}
    assert check_generated(d, "PtLSV")["jawaban"] == {"rel": ">=", "value": 5}
    with pytest.raises(AIError):
        check_generated({**d, "c": -5}, "PtLSV")  # bukan bilangan bulat
    with pytest.raises(AIError):
        check_generated({**d, "rel": "="}, "PtLSV")  # relasi tidak cocok jenis


def test_soal_endpoint_retries_until_valid(fake_ai) -> None:
    bad = json.dumps({"cerita": "c", "pertanyaan": "p", "a": 3, "b": 1, "rel": "=", "c": 5})
    good = json.dumps(
        {
            "judul": "Tabungan",
            "cerita": "Rina menabung",
            "pertanyaan": "Berapa minggu?",
            "a": 5,
            "b": 10,
            "rel": ">=",
            "c": 60,
        }
    )
    calls = fake_ai([bad, good])
    res = client.post("/api/v1/ai/soal", json={"level": "sedang", "jenis": "PtLSV"})
    assert res.status_code == 200, res.text
    assert res.json()["jawaban"] == {"rel": ">=", "value": 10}
    assert len(calls) == 2


def test_ai_error_message_is_friendly(monkeypatch) -> None:
    async def boom(*a, **k):
        raise AIError("Saldo/kuota akun AI habis.")

    monkeypatch.setattr(ai_router, "chat", boom)
    res = client.post("/api/v1/ai/chat", json={"messages": [{"role": "user", "content": "hai"}]})
    assert res.status_code == 502
    assert res.json()["detail"] == "Saldo/kuota akun AI habis."
