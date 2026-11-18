"""Koneksi basis data.

- Lokal (laptop): SQLite di backend/data/langkah.db (dibuat otomatis).
- Hosting (Render): WAJIB PostgreSQL lewat DATABASE_URL (disk Render gratis tidak permanen).
Skema dibuat/diubah lewat migrasi Alembic (`uv run alembic upgrade head`); saat server menyala,
migrasi dijalankan otomatis.
"""

from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import event
from sqlmodel import Session, create_engine

from app.config import get_settings


def normalize_url(url: str) -> str:
    # Render/Neon/Supabase memberi "postgres://" atau "postgresql://"; pakai driver psycopg 3.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


def make_engine(url: str | None = None):
    url = normalize_url(url or get_settings().database_url)
    if url.startswith("sqlite"):
        path = url.split("///", 1)[-1]
        if path and path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        eng = create_engine(url, connect_args={"check_same_thread": False})

        @event.listens_for(eng, "connect")
        def _fk_on(dbapi_conn, _):  # pragma: no cover - detail SQLite
            dbapi_conn.execute("PRAGMA foreign_keys=ON")

        return eng
    return create_engine(url, pool_pre_ping=True)


engine = make_engine()


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def run_migrations(url: str | None = None) -> None:
    """Jalankan `alembic upgrade head` dari kode (dipakai saat server menyala dan di tes)."""
    from alembic import command
    from alembic.config import Config

    base = Path(__file__).resolve().parents[1]
    cfg = Config(str(base / "alembic.ini"))
    cfg.set_main_option("script_location", str(base / "alembic"))
    cfg.set_main_option("sqlalchemy.url", normalize_url(url or get_settings().database_url))
    command.upgrade(cfg, "head")
