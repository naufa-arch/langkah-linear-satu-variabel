"""Memastikan frontend tersaji dengan benar dan semua berkasnya masuk daftar offline (sw.js)."""

import re
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
FRONTEND = Path(__file__).resolve().parents[2] / "frontend"
SKIP_SUFFIX = {".txt", ".md"}


def test_index_served() -> None:
    res = client.get("/")
    assert res.status_code == 200
    assert "Langkah Linear" in res.text


def test_js_module_mime_type() -> None:
    res = client.get("/src/main.js")
    assert res.status_code == 200
    assert "javascript" in res.headers["content-type"]


def test_manifest_mime_type() -> None:
    res = client.get("/manifest.webmanifest")
    assert res.headers["content-type"].startswith("application/manifest+json")


def test_api_not_shadowed_by_static() -> None:
    assert client.get("/api/v1/health").json()["status"] == "ok"


def test_every_frontend_file_is_precached() -> None:
    sw = (FRONTEND / "sw.js").read_text(encoding="utf-8")
    listed = set(re.findall(r"'(/[^']*)'", sw.split("const PRECACHE")[1].split("];")[0]))
    files = {
        "/" + p.relative_to(FRONTEND).as_posix()
        for p in FRONTEND.rglob("*")
        if p.is_file() and p.suffix not in SKIP_SUFFIX and p.name != "sw.js"
    }
    missing = sorted(files - listed)
    assert not missing, f"Tambahkan ke PRECACHE di sw.js: {missing}"
    extra = sorted(p for p in listed - files if p != "/")
    assert not extra, f"Berkas di PRECACHE tidak ada: {extra}"


def test_math_files_have_no_imports() -> None:
    # linear.js & keywords.js dijalankan di V8 oleh pytest, jadi tidak boleh memakai import.
    for f in ("src/math/linear.js", "src/content/keywords.js"):
        src = (FRONTEND / f).read_text(encoding="utf-8")
        assert not re.search(r"^\s*import\s", src, re.M), f
