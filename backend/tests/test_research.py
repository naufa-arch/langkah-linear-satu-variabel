"""Data penelitian: kode siswa tidak tertukar, kiriman idempoten, penskoran & ekspor."""

import json
import re
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import instrument as instrument_mod
from app.instrument import instrument, max_scores, max_total, public_items
from app.main import app

client = TestClient(app)
FRONTEND = Path(__file__).resolve().parents[2] / "frontend"
# Kunci instrumen tidak di-commit (repo publik); tes yang memerlukannya dilewati bila tidak ada.
needs_instrument = pytest.mark.skipif(
    not instrument_mod.PATH.is_file(), reason="instrumen_literasi.json tidak ada (tidak di-commit)"
)


def _login() -> dict[str, str]:
    tok = client.post("/api/v1/peneliti/login", json={"password": "sandi-uji"}).json()["token"]
    return {"Authorization": f"Bearer {tok}"}


def _ev(kind="latihan.jawab", **data):
    return {"id": str(uuid.uuid4()), "kind": kind, "ts": "2026-11-18T08:00:00Z", "data": data}


@needs_instrument
def test_instrument_matches_revised_document() -> None:
    ins = instrument()
    assert [s["id"] for s in ins["soal"]] == ["S1", "S2", "S3", "S4", "S5"]
    assert max_scores() == {
        "S1": [1, 2, 1, 1, 1],
        "S2": [1, 1, 2, 1, 1],
        "S3": [1, 1, 2, 1, 1],
        "S4": [1] * 6,
        "S5": [1] * 6,
    }
    assert all(sum(v) == 6 for v in max_scores().values())
    assert max_total() == 30


@needs_instrument
def test_frontend_items_equal_backend_items_without_key() -> None:
    # Soal di HP (frontend/src/content/literasi.js) harus sama persis dengan instrumen di server,
    # dan TIDAK memuat kunci jawaban.
    src = (FRONTEND / "src/content/literasi.js").read_text(encoding="utf-8")
    body = re.search(r"export const LITERASI = (\{.*?\});\s*$", src, re.S).group(1)
    data = json.loads(body)
    assert data["soal"] == public_items()
    assert data["id"] == instrument()["id"]
    assert "kunci" not in src
    for item in instrument()["soal"]:
        for t in item["tahap"]:
            assert t["kunci"] not in src


def test_events_batch_is_idempotent() -> None:
    ident = {"student_code": "S-01", "class_code": "UJI-A"}
    evs = [_ev(ok=True, attempt=1), _ev(ok=False, attempt=1, code="M2")]
    r1 = client.post("/api/v1/events/batch", json={**ident, "events": evs}).json()
    r2 = client.post("/api/v1/events/batch", json={**ident, "events": evs}).json()
    assert r1["accepted"] == 2 and r1["duplicates"] == 0
    assert r2["accepted"] == 0 and r2["duplicates"] == 2
    # duplikat di dalam satu kiriman juga hanya disimpan sekali
    e = _ev()
    r3 = client.post("/api/v1/events/batch", json={**ident, "events": [e, e]}).json()
    assert r3["accepted"] == 1


def test_same_student_code_in_two_classes_is_kept_apart() -> None:
    for kelas, n in (("UJI-B", 3), ("UJI-C", 1)):
        evs = [_ev(ok=True, attempt=1) for _ in range(n)]
        client.post(
            "/api/v1/events/batch",
            json={"student_code": "S-07", "class_code": kelas, "events": evs},
        )
    h = _login()
    b = client.get("/api/v1/peneliti/ringkasan?kelas=UJI-B", headers=h).json()["siswa"]
    c = client.get("/api/v1/peneliti/ringkasan?kelas=UJI-C", headers=h).json()["siswa"]
    assert [s["kode_siswa"] for s in b] == ["S-07"] and b[0]["latihan"]["soal_dicoba"] == 3
    assert [s["kode_siswa"] for s in c] == ["S-07"] and c[0]["latihan"]["soal_dicoba"] == 1
    assert b[0]["id"] != c[0]["id"]


def test_invalid_codes_rejected() -> None:
    bad = client.post("/api/v1/enroll", json={"student_code": "Budi Santoso"})
    assert bad.status_code == 422


def _answers(fill="jawaban"):
    return {sid: [f"{fill} {i}" for i in range(len(m))] for sid, m in max_scores().items()}


@needs_instrument
def test_literacy_submit_score_and_export() -> None:
    ident = {"student_code": "S-02", "class_code": "UJI-D"}
    att_id = str(uuid.uuid4())
    body = {**ident, "id": att_id, "test_kind": "pretest", "answers": _answers()}
    assert client.post("/api/v1/literasi/attempts", json=body).json()["duplicate"] is False
    assert client.post("/api/v1/literasi/attempts", json=body).json()["duplicate"] is True

    # siswa lain tidak boleh memakai id yang sama
    other = {**body, "student_code": "S-03"}
    assert client.post("/api/v1/literasi/attempts", json=other).status_code == 409

    # pre-test: siswa belum melihat skor dan TIDAK mendapat kunci
    res = client.post(f"/api/v1/literasi/attempts/{att_id}/hasil", json=ident).json()
    assert res["dinilai"] is False and "pembahasan" not in res
    # siswa lain tidak bisa membaca hasil ini
    stranger = {"student_code": "S-09", "class_code": "UJI-D"}
    assert (
        client.post(f"/api/v1/literasi/attempts/{att_id}/hasil", json=stranger).status_code == 404
    )

    h = _login()
    assert client.get("/api/v1/peneliti/literasi").status_code == 401
    bad = {"skor": {**{k: [9] * len(v) for k, v in max_scores().items()}}}
    assert (
        client.put(f"/api/v1/peneliti/literasi/{att_id}/skor", json=bad, headers=h).status_code
        == 422
    )
    good = {"skor": {k: list(v) for k, v in max_scores().items()}, "catatan": "uji"}
    good["skor"]["S5"][5] = 0
    row = client.put(f"/api/v1/peneliti/literasi/{att_id}/skor", json=good, headers=h).json()
    assert row["total"] == 29 and row["maks"] == 30

    res = client.post(f"/api/v1/literasi/attempts/{att_id}/hasil", json=ident).json()
    assert res["dinilai"] is True and res["total"] == 29

    csv_text = client.get("/api/v1/peneliti/ekspor/literasi.csv?kelas=UJI-D", headers=h).text
    lines = csv_text.lstrip("﻿").splitlines()
    assert lines[0].startswith("id_pengerjaan;kode_kelas;kode_siswa")
    assert any(att_id in ln and ";29;30;96,67;" in ln for ln in lines[1:])


@needs_instrument
def test_practice_attempt_gets_pembahasan() -> None:
    ident = {"student_code": "S-04", "class_code": ""}
    att_id = str(uuid.uuid4())
    body = {**ident, "id": att_id, "test_kind": "latihan", "answers": _answers()}
    client.post("/api/v1/literasi/attempts", json=body)
    res = client.post(f"/api/v1/literasi/attempts/{att_id}/hasil", json=ident).json()
    assert len(res["pembahasan"]["S3"]) == 5
    assert res["pembahasan"]["S3"] == [t["kunci"] for t in instrument()["soal"][2]["tahap"]]


def test_wrong_researcher_password() -> None:
    assert client.post("/api/v1/peneliti/login", json={"password": "salah"}).status_code == 401
    assert (
        client.get("/api/v1/peneliti/ringkasan", headers={"Authorization": "Bearer x"}).status_code
        == 401
    )


def test_exports_have_bom_and_headers() -> None:
    h = _login()
    for name in ("kejadian", "siswa"):
        r = client.get(f"/api/v1/peneliti/ekspor/{name}.csv", headers=h)
        assert r.status_code == 200 and r.text.startswith("﻿")
        assert "attachment" in r.headers["content-disposition"]


def test_missing_instrument_gives_clear_503(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(instrument_mod, "PATH", tmp_path / "tidak-ada.json")
    monkeypatch.setattr(instrument_mod, "SECRET_PATH", tmp_path / "tidak-ada-2.json")
    monkeypatch.delenv("INSTRUMEN_LITERASI_PATH", raising=False)
    instrument_mod.instrument.cache_clear()
    try:
        res = client.get("/api/v1/literasi/instrumen")
        assert res.status_code == 503
        assert "belum dipasang" in res.json()["detail"]
    finally:
        instrument_mod.instrument.cache_clear()
