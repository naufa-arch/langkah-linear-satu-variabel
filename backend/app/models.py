"""Model data penelitian. Siswa HANYA dikenali lewat kode (tanpa nama asli).

Satu siswa = pasangan (kode_kelas, kode_siswa), sehingga "S-07" di kelas 8A dan "S-07" di kelas 8B
adalah dua siswa yang berbeda dan datanya tidak tertukar.
"""

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel


def now() -> datetime:
    return datetime.now(UTC)


class Student(SQLModel, table=True):
    __tablename__ = "student"
    __table_args__ = (UniqueConstraint("class_code", "student_code", name="uq_student_code"),)

    id: int | None = Field(default=None, primary_key=True)
    student_code: str = Field(max_length=12, index=True)
    class_code: str = Field(default="", max_length=12, index=True)
    created_at: datetime = Field(default_factory=now, sa_type=DateTime(timezone=True))
    last_seen: datetime = Field(default_factory=now, sa_type=DateTime(timezone=True))


class Event(SQLModel, table=True):
    """Satu kejadian belajar (jawab latihan, selesai materi, tanya AI, ...). id = UUID dari HP."""

    __tablename__ = "event"

    id: str = Field(primary_key=True, max_length=36)
    student_id: int = Field(foreign_key="student.id", index=True)
    kind: str = Field(max_length=40, index=True)
    data: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    client_ts: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    received_at: datetime = Field(default_factory=now, sa_type=DateTime(timezone=True))


class LiteracyAttempt(SQLModel, table=True):
    """Satu kali pengerjaan tes Mathematical Literacy (pre-test, post-test, atau latihan)."""

    __tablename__ = "literacy_attempt"

    id: str = Field(primary_key=True, max_length=36)
    student_id: int = Field(foreign_key="student.id", index=True)
    test_kind: str = Field(max_length=12, index=True)  # pretest | posttest | latihan
    instrument_id: str = Field(max_length=60)
    started_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    submitted_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    received_at: datetime = Field(default_factory=now, sa_type=DateTime(timezone=True))
    # {"S1": ["jawaban tahap 1", "jawaban tahap 2", ...], ...}
    answers: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    # Skor akhir dari peneliti: {"S1": [1, 2, 1, 1, 1], ...}
    scores: dict | None = Field(default=None, sa_column=Column(JSON, nullable=True))
    total_score: int | None = None
    max_score: int = 0
    scored_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    scorer_note: str = Field(default="", max_length=2000)
    # Saran skor dari AI (bukan skor akhir)
    ai_suggestion: dict | None = Field(default=None, sa_column=Column(JSON, nullable=True))
