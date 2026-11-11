"""Titik masuk FastAPI.

- /api/v1/...  : API (endpoint data penelitian ditambahkan di Sprint S6, lihat docs/ROADMAP.md)
- /            : frontend (folder ../frontend) disajikan sebagai berkas statis
"""

import mimetypes

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings

API_VERSION = "0.1.0"

# Windows kadang memetakan .js ke text/plain, padahal ES module wajib JavaScript.
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("font/woff2", ".woff2")

settings = get_settings()

app = FastAPI(title=settings.app_name, version=API_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    """Dipakai frontend & hosting untuk memeriksa apakah server hidup."""
    return {"status": "ok", "version": API_VERSION, "environment": settings.environment}


# Dipasang paling akhir agar tidak menutupi rute /api.
if settings.frontend_path.is_dir():
    app.mount("/", StaticFiles(directory=settings.frontend_path, html=True), name="frontend")
