"""Login peneliti (JWT). Siswa tidak perlu login: mereka hanya MENULIS data dengan kodenya."""

import hmac
from datetime import UTC, datetime, timedelta
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings

ALG = "HS256"
bearer = HTTPBearer(auto_error=False)


def _secret(s: Settings) -> str:
    if not s.jwt_secret or not s.researcher_password:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Dasbor peneliti belum aktif. Isi RESEARCHER_PASSWORD dan JWT_SECRET di .env.",
        )
    return s.jwt_secret


def check_password(s: Settings, password: str) -> bool:
    _secret(s)
    return hmac.compare_digest(password.encode(), s.researcher_password.encode())


def issue_token(s: Settings, hours: int = 12) -> str:
    exp = datetime.now(UTC) + timedelta(hours=hours)
    return jwt.encode({"sub": "peneliti", "exp": exp}, _secret(s), algorithm=ALG)


def require_researcher(
    cred: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    s: Annotated[Settings, Depends(get_settings)],
) -> str:
    secret = _secret(s)
    if cred is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Perlu login peneliti.")
    try:
        payload = jwt.decode(cred.credentials, secret, algorithms=[ALG])
    except jwt.PyJWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesi login berakhir. Masuk lagi.") from e
    if payload.get("sub") != "peneliti":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bukan akun peneliti.")
    return "peneliti"
