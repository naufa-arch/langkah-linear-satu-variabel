"""Endpoint untuk HP siswa. Siswa hanya MENULIS data miliknya (dikenali lewat kode, bukan nama).

Semua kiriman memakai UUID dari HP, sehingga pengiriman ulang (misalnya setelah offline) tidak
membuat data ganda (idempoten).
"""

import re
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlmodel import Session, select

from app.db import get_session
from app.instrument import TEST_KINDS, instrument, max_scores, max_total, public_items
from app.models import Event, LiteracyAttempt, Student, now

router = APIRouter(prefix="/api/v1", tags=["siswa"])

CODE = re.compile(r"^[A-Z0-9-]{2,12}$")
KIND = re.compile(r"^[a-z0-9._-]{1,40}$")
UUID = re.compile(r"^[0-9a-fA-F-]{8,36}$")
SessionDep = Annotated[Session, Depends(get_session)]


class Identity(BaseModel):
    student_code: str
    class_code: str = ""

    @field_validator("student_code")
    @classmethod
    def _student(cls, v: str) -> str:
        v = v.strip().upper()
        if not CODE.match(v):
            raise ValueError("Kode siswa: huruf/angka/tanda hubung, 2-12 karakter.")
        return v

    @field_validator("class_code")
    @classmethod
    def _class(cls, v: str) -> str:
        v = v.strip().upper()
        if v and not CODE.match(v):
            raise ValueError("Kode kelas: huruf/angka/tanda hubung, 2-12 karakter.")
        return v


def get_or_create_student(db: Session, ident: Identity) -> Student:
    st = db.exec(
        select(Student).where(
            Student.student_code == ident.student_code, Student.class_code == ident.class_code
        )
    ).first()
    if st is None:
        st = Student(student_code=ident.student_code, class_code=ident.class_code)
        db.add(st)
        db.flush()
    else:
        st.last_seen = now()
        db.add(st)
    return st


@router.post("/enroll")
def enroll(body: Identity, db: SessionDep) -> dict[str, Any]:
    st = get_or_create_student(db, body)
    db.commit()
    return {"ok": True, "student_code": st.student_code, "class_code": st.class_code}


class EventIn(BaseModel):
    id: str
    kind: str
    ts: datetime | None = None
    data: dict[str, Any] = Field(default_factory=dict)

    @field_validator("id")
    @classmethod
    def _id(cls, v: str) -> str:
        if not UUID.match(v):
            raise ValueError("id kejadian harus UUID.")
        return v.lower()

    @field_validator("kind")
    @classmethod
    def _kind(cls, v: str) -> str:
        if not KIND.match(v):
            raise ValueError("jenis kejadian tidak sah.")
        return v

    @field_validator("data")
    @classmethod
    def _size(cls, v: dict) -> dict:
        if len(str(v)) > 8000:
            raise ValueError("data kejadian terlalu besar.")
        return v


class EventBatch(Identity):
    events: list[EventIn] = Field(max_length=200)


@router.post("/events/batch")
def events_batch(body: EventBatch, db: SessionDep) -> dict[str, Any]:
    st = get_or_create_student(db, body)
    ids = [e.id for e in body.events]
    existing = set(db.exec(select(Event.id).where(Event.id.in_(ids))).all()) if ids else set()
    accepted = 0
    seen: set[str] = set()
    for e in body.events:
        if e.id in existing or e.id in seen:
            continue
        seen.add(e.id)
        db.add(Event(id=e.id, student_id=st.id, kind=e.kind, data=e.data, client_ts=e.ts))
        accepted += 1
    db.commit()
    # `ids` dikembalikan agar HP tahu kejadian mana yang boleh dihapus dari antrean
    return {"accepted": accepted, "duplicates": len(ids) - accepted, "ids": ids}


@router.get("/literasi/instrumen")
def literacy_instrument() -> dict[str, Any]:
    """Soal tanpa kunci jawaban."""
    ins = instrument()
    return {
        "id": ins["id"],
        "petunjuk": ins["petunjuk"],
        "soal": public_items(),
        "skor_maks": max_total(),
    }


class AttemptIn(Identity):
    id: str
    test_kind: str
    started_at: datetime | None = None
    submitted_at: datetime | None = None
    answers: dict[str, list[str]]

    @field_validator("id")
    @classmethod
    def _id(cls, v: str) -> str:
        if not UUID.match(v):
            raise ValueError("id pengerjaan harus UUID.")
        return v.lower()

    @field_validator("test_kind")
    @classmethod
    def _kind(cls, v: str) -> str:
        if v not in TEST_KINDS:
            raise ValueError(f"jenis tes harus salah satu dari {TEST_KINDS}.")
        return v

    @field_validator("answers")
    @classmethod
    def _answers(cls, v: dict[str, list[str]]) -> dict[str, list[str]]:
        mx = max_scores()
        for sid, parts in v.items():
            if sid not in mx:
                raise ValueError(f"nomor soal tidak dikenal: {sid}")
            if len(parts) != len(mx[sid]):
                raise ValueError(f"{sid} harus berisi {len(mx[sid])} jawaban tahap.")
            if any(len(p) > 3000 for p in parts):
                raise ValueError("jawaban terlalu panjang.")
        return v


@router.post("/literasi/attempts")
def submit_attempt(body: AttemptIn, db: SessionDep) -> dict[str, Any]:
    st = get_or_create_student(db, body)
    old = db.get(LiteracyAttempt, body.id)
    if old is not None:
        if old.student_id != st.id:
            raise HTTPException(409, "ID pengerjaan sudah dipakai siswa lain.")
        db.commit()
        return {"ok": True, "duplicate": True, "id": old.id}
    answers = {sid: body.answers.get(sid, [""] * len(m)) for sid, m in max_scores().items()}
    db.add(
        LiteracyAttempt(
            id=body.id,
            student_id=st.id,
            test_kind=body.test_kind,
            instrument_id=instrument()["id"],
            started_at=body.started_at,
            submitted_at=body.submitted_at or now(),
            answers=answers,
            max_score=max_total(),
        )
    )
    db.commit()
    return {"ok": True, "duplicate": False, "id": body.id}


def _own_attempt(db: Session, attempt_id: str, ident: Identity) -> LiteracyAttempt:
    att = db.get(LiteracyAttempt, attempt_id.lower())
    st = db.exec(
        select(Student).where(
            Student.student_code == ident.student_code, Student.class_code == ident.class_code
        )
    ).first()
    if att is None or st is None or att.student_id != st.id:
        raise HTTPException(404, "Pengerjaan tidak ditemukan.")
    return att


@router.post("/literasi/attempts/{attempt_id}/hasil")
def attempt_result(attempt_id: str, body: Identity, db: SessionDep) -> dict[str, Any]:
    """Hasil milik siswa sendiri: skor (bila sudah dinilai) dan pembahasan (hanya mode latihan)."""
    att = _own_attempt(db, attempt_id, body)
    out: dict[str, Any] = {
        "id": att.id,
        "test_kind": att.test_kind,
        "dinilai": att.total_score is not None,
        "total": att.total_score,
        "maks": att.max_score,
        "skor": att.scores,
    }
    if att.test_kind == "latihan":
        out["pembahasan"] = {
            s["id"]: [t["kunci"] for t in s["tahap"]] for s in instrument()["soal"]
        }
    return out
