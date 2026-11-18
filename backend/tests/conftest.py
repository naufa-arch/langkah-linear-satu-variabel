"""Tes memakai basis data SQLite sementara dan kunci AI palsu, jadi data asli & kuota AI aman."""

import os
import tempfile
from pathlib import Path

_TMP = Path(tempfile.mkdtemp(prefix="langkah-test-"))
os.environ["DATABASE_URL"] = f"sqlite:///{(_TMP / 'test.db').as_posix()}"
os.environ["RESEARCHER_PASSWORD"] = "sandi-uji"
os.environ["JWT_SECRET"] = "rahasia-uji-yang-cukup-panjang-untuk-hs256"
os.environ["DEEPSEEK_API_KEY"] = "kunci-palsu-untuk-tes"
os.environ["GEMINI_API_KEY"] = ""
os.environ["AI_REQUESTS_PER_MINUTE"] = "1000"

from app.db import run_migrations  # noqa: E402

run_migrations()
