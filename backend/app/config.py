"""Pengaturan aplikasi, dibaca dari variabel lingkungan atau berkas .env.

Berkas .env dicari di dua tempat (yang belakangan menang):
  1. ../.env      (folder utama proyek, tempat kunci API saat ini disimpan)
  2. .env         (folder backend/)
Di hosting (Render), isi lewat menu Environment, bukan berkas.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_FRONTEND = BACKEND_DIR.parent / "frontend"
DEFAULT_DB = f"sqlite:///{(BACKEND_DIR / 'data' / 'langkah.db').as_posix()}"

# Asal (origin) server lokal + aplikasi Android (Capacitor).
DEFAULT_CORS = "http://localhost:8000,http://127.0.0.1:8000,https://localhost,capacitor://localhost,http://localhost"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_DIR.parent / ".env"), str(BACKEND_DIR / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Langkah Linear API"
    environment: str = "development"

    # API Key Gemini (sudah dipakai sebelumnya, tetap dipertahankan sebagai cadangan)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"

    # API Key DeepSeek (penyedia utama bila terisi). Kunci hanya di server, tidak dikirim ke HP.
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    # auto = DeepSeek bila DEEPSEEK_API_KEY terisi, jika tidak Gemini
    ai_provider: str = "auto"
    ai_timeout_seconds: float = 45.0
    ai_requests_per_minute: int = 20

    cors_origins: str = DEFAULT_CORS

    frontend_path: Path = DEFAULT_FRONTEND

    # Data penelitian
    database_url: str = DEFAULT_DB
    researcher_password: str = ""
    jwt_secret: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
