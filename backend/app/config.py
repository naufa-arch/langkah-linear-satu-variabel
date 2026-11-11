"""Pengaturan aplikasi, dibaca dari variabel lingkungan atau berkas .env."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_FRONTEND = Path(__file__).resolve().parents[2] / "frontend"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Langkah Linear API"
    environment: str = "development"
    # Daftar domain frontend yang boleh memanggil API, dipisah koma.
    cors_origins: str = "http://localhost:8000,http://127.0.0.1:8000"
    # Folder frontend yang disajikan di "/". Bisa diganti lewat FRONTEND_PATH.
    frontend_path: Path = DEFAULT_FRONTEND

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
