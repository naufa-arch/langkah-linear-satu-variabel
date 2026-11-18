"""Titik masuk FastAPI.

- /api/v1/health          : cek server hidup
- /api/v1/ai/...          : tutor AI (DeepSeek / Gemini), kunci API hanya di server
- /api/v1/enroll, events, literasi : data belajar siswa (hanya menulis, dikenali lewat kode)
- /api/v1/peneliti/...    : dasbor, penskoran & ekspor CSV (wajib login peneliti)
- /                       : frontend (folder ../frontend) disajikan sebagai berkas statis
"""

import logging
import mimetypes
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.ai.client import active_provider
from app.config import get_settings
from app.db import run_migrations
from app.instrument import InstrumentMissing
from app.routers import ai, research, student

API_VERSION = "0.4.0"
log = logging.getLogger("langkah")

# Windows kadang memetakan .js ke text/plain, padahal ES module wajib JavaScript.
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("font/woff2", ".woff2")

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    run_migrations()  # membuat/memperbarui tabel basis data
    p = active_provider(settings)
    log.warning("Tutor AI: %s", f"{p.name} ({p.model})" if p else "belum ada kunci API")
    yield


app = FastAPI(title=settings.app_name, version=API_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/api/v1/health")
def health() -> dict[str, str | bool]:
    """Dipakai frontend & hosting untuk memeriksa apakah server hidup."""
    return {
        "status": "ok",
        "version": API_VERSION,
        "environment": settings.environment,
        "ai": active_provider(settings) is not None,
    }


@app.exception_handler(InstrumentMissing)
async def _instrument_missing(_: Request, exc: InstrumentMissing) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(exc)})


app.include_router(ai.router)
app.include_router(student.router)
app.include_router(research.router)

# Dipasang paling akhir agar tidak menutupi rute /api.
if settings.frontend_path.is_dir():
    app.mount("/", StaticFiles(directory=settings.frontend_path, html=True), name="frontend")
