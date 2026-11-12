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
    listed = set(re.findall(r"'\.(/[^']*)'", sw.split("const PRECACHE")[1].split("];")[0]))
    files = {
        "/" + p.relative_to(FRONTEND).as_posix()
        for p in FRONTEND.rglob("*")
        if p.is_file() and p.suffix not in SKIP_SUFFIX and p.name != "sw.js"
    }
    missing = sorted(files - listed)
    assert not missing, f"Tambahkan ke PRECACHE di sw.js: {missing}"
    extra = sorted(p for p in listed - files if p != "/")
    assert not extra, f"Berkas di PRECACHE tidak ada: {extra}"


def test_frontend_uses_relative_paths() -> None:
    # GitHub Pages menyajikan aplikasi di sub-folder (/nama-repo/), jadi alamat berkas
    # tidak boleh diawali "/" (akar situs). Pakai alamat relatif, mis. "fonts/..." atau "../x.js".
    pattern = re.compile(
        r"""(?:href=|src=|url\(|from\s|import\(|register\(|"src":\s?)["']?/(?!/)"""
    )
    for p in FRONTEND.rglob("*"):
        if p.suffix not in {".html", ".js", ".css", ".webmanifest"} or "vendor" in p.parts:
            continue
        for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            where = f"{p.relative_to(FRONTEND)}:{n}"
            assert not pattern.search(line), f"{where} memakai alamat absolut: {line.strip()}"


def test_v8_tested_files_use_single_line_imports() -> None:
    # File ini dijalankan di V8 oleh pytest: import hanya boleh satu baris dan dari file uji lain.
    allowed = {"./linear.js", "../math/linear.js"}
    for f in (
        "src/math/linear.js",
        "src/math/practice.js",
        "src/content/keywords.js",
        "src/content/stories.js",
    ):
        src = (FRONTEND / f).read_text(encoding="utf-8")
        for line in re.findall(r"^\s*import\s.*$", src, re.M):
            m = re.match(r"^import \{[^}]*\} from '([^']+)';$", line.strip())
            assert m and m.group(1) in allowed, f"{f}: {line}"


def test_routes_exist_for_modules() -> None:
    main = (FRONTEND / "src/main.js").read_text(encoding="utf-8")
    modules = (FRONTEND / "src/content/modules.js").read_text(encoding="utf-8")
    for route in re.findall(r"route: '#/([\w-]+)", modules):
        assert f"'{route}'" in main, f"rute #{route} belum terdaftar di main.js"
