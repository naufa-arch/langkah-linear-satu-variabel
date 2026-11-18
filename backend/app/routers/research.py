"""Dasbor & ekspor peneliti (wajib login). Semua data siswa hanya berupa kode."""

import csv
import io
import json
from collections import Counter, defaultdict
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from sqlmodel import Session, select

from app.ai.client import AIError, AIUnavailable, chat, parse_json
from app.ai.prompts import SKOR_JSON
from app.config import Settings, get_settings
from app.db import get_session
from app.instrument import instrument, max_scores, validate_scores
from app.models import Event, LiteracyAttempt, Student, now
from app.security import check_password, issue_token, require_researcher

router = APIRouter(prefix="/api/v1/peneliti", tags=["peneliti"])
SessionDep = Annotated[Session, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
Auth = Depends(require_researcher)


class LoginIn(BaseModel):
    password: str


@router.post("/login")
def login(body: LoginIn, s: SettingsDep) -> dict[str, str]:
    if not check_password(s, body.password):
        raise HTTPException(401, "Kata sandi peneliti salah.")
    return {"token": issue_token(s)}


def _students(db: Session, class_code: str | None) -> list[Student]:
    q = select(Student)
    if class_code:
        q = q.where(Student.class_code == class_code.upper())
    return list(db.exec(q.order_by(Student.class_code, Student.student_code)).all())


def _practice_stats(events: list[Event]) -> dict[str, Any]:
    """Rekap latihan mandiri dari kejadian 'latihan.jawab'."""
    tries = [e for e in events if e.kind == "latihan.jawab"]
    first = [e for e in tries if e.data.get("attempt") == 1]
    correct_first = sum(1 for e in first if e.data.get("ok"))
    solved = sum(1 for e in tries if e.data.get("ok"))
    mis = Counter(e.data.get("code") for e in tries if not e.data.get("ok") and e.data.get("code"))
    return {
        "soal_dicoba": len(first),
        "benar_percobaan_pertama": correct_first,
        "soal_terselesaikan": solved,
        "akurasi_pertama_persen": round(100 * correct_first / len(first)) if first else None,
        "miskonsepsi": dict(mis.most_common()),
    }


@router.get("/ringkasan", dependencies=[Auth])
def summary(db: SessionDep, kelas: str | None = None) -> dict[str, Any]:
    studs = _students(db, kelas)
    ids = [s.id for s in studs]
    events = list(db.exec(select(Event).where(Event.student_id.in_(ids))).all()) if ids else []
    atts = (
        list(db.exec(select(LiteracyAttempt).where(LiteracyAttempt.student_id.in_(ids))).all())
        if ids
        else []
    )
    by_ev: dict[int, list[Event]] = defaultdict(list)
    for e in events:
        by_ev[e.student_id].append(e)
    by_att: dict[int, list[LiteracyAttempt]] = defaultdict(list)
    for a in atts:
        by_att[a.student_id].append(a)
    rows = []
    for st in studs:
        ev = by_ev[st.id]
        rows.append(
            {
                "id": st.id,
                "kode_siswa": st.student_code,
                "kode_kelas": st.class_code,
                "terakhir_aktif": st.last_seen.isoformat() if st.last_seen else None,
                "jumlah_kejadian": len(ev),
                "materi_selesai": len(
                    {e.data.get("id") for e in ev if e.kind == "aktivitas.selesai"}
                ),
                "tanya_ai": sum(1 for e in ev if e.kind.startswith("ai.")),
                "latihan": _practice_stats(ev),
                "literasi": {
                    k: _best(by_att[st.id], k) for k in ("pretest", "posttest", "latihan")
                },
            }
        )
    return {
        "kelas": sorted({s.class_code for s in _students(db, None)}),
        "siswa": rows,
        "jumlah_pengerjaan_literasi": len(atts),
        "belum_dinilai": sum(1 for a in atts if a.total_score is None),
    }


def _best(atts: list[LiteracyAttempt], kind: str) -> dict[str, Any] | None:
    xs = sorted((a for a in atts if a.test_kind == kind), key=lambda a: a.received_at)
    if not xs:
        return None
    last = xs[-1]  # pengerjaan terakhir dipakai sebagai data utama
    return {"id": last.id, "total": last.total_score, "maks": last.max_score, "kali": len(xs)}


@router.get("/siswa/{student_id}/riwayat", dependencies=[Auth])
def history(student_id: int, db: SessionDep, limit: int = Query(500, le=5000)) -> dict[str, Any]:
    st = db.get(Student, student_id)
    if st is None:
        raise HTTPException(404, "Siswa tidak ditemukan.")
    ev = db.exec(
        select(Event)
        .where(Event.student_id == student_id)
        .order_by(Event.client_ts.desc(), Event.received_at.desc())
        .limit(limit)
    ).all()
    return {
        "siswa": {"id": st.id, "kode_siswa": st.student_code, "kode_kelas": st.class_code},
        "latihan": _practice_stats(list(ev)),
        "kejadian": [
            {
                "id": e.id,
                "jenis": e.kind,
                "waktu": (e.client_ts or e.received_at).isoformat(),
                "data": e.data,
            }
            for e in ev
        ],
    }


def _attempt_row(a: LiteracyAttempt, st: Student) -> dict[str, Any]:
    return {
        "id": a.id,
        "kode_siswa": st.student_code,
        "kode_kelas": st.class_code,
        "jenis_tes": a.test_kind,
        "dikumpulkan": (a.submitted_at or a.received_at).isoformat(),
        "total": a.total_score,
        "maks": a.max_score,
        "dinilai": a.total_score is not None,
        "ada_saran_ai": a.ai_suggestion is not None,
    }


@router.get("/literasi", dependencies=[Auth])
def attempts(
    db: SessionDep, kelas: str | None = None, jenis: str | None = None
) -> list[dict[str, Any]]:
    q = select(LiteracyAttempt, Student).join(Student, Student.id == LiteracyAttempt.student_id)
    if kelas:
        q = q.where(Student.class_code == kelas.upper())
    if jenis:
        q = q.where(LiteracyAttempt.test_kind == jenis)
    rows = db.exec(q.order_by(LiteracyAttempt.received_at.desc())).all()
    return [_attempt_row(a, st) for a, st in rows]


def _get_attempt(db: Session, attempt_id: str) -> tuple[LiteracyAttempt, Student]:
    a = db.get(LiteracyAttempt, attempt_id.lower())
    if a is None:
        raise HTTPException(404, "Pengerjaan tidak ditemukan.")
    return a, db.get(Student, a.student_id)


@router.get("/literasi/{attempt_id}", dependencies=[Auth])
def attempt_detail(attempt_id: str, db: SessionDep) -> dict[str, Any]:
    a, st = _get_attempt(db, attempt_id)
    return {
        **_attempt_row(a, st),
        "jawaban": a.answers,
        "skor": a.scores,
        "catatan": a.scorer_note,
        "saran_ai": a.ai_suggestion,
        "instrumen": instrument(),
    }


class ScoreIn(BaseModel):
    skor: dict[str, list[int]]
    catatan: str = ""


@router.put("/literasi/{attempt_id}/skor", dependencies=[Auth])
def set_score(attempt_id: str, body: ScoreIn, db: SessionDep) -> dict[str, Any]:
    a, st = _get_attempt(db, attempt_id)
    try:
        clean = validate_scores(body.skor)
    except ValueError as e:
        raise HTTPException(422, str(e)) from e
    a.scores = clean
    a.total_score = sum(sum(v) for v in clean.values())
    a.scorer_note = body.catatan[:2000]
    a.scored_at = now()
    db.add(a)
    db.commit()
    return _attempt_row(a, st)


@router.post("/literasi/{attempt_id}/saran-ai", dependencies=[Auth])
async def ai_suggest(attempt_id: str, db: SessionDep, s: SettingsDep) -> dict[str, Any]:
    """Minta AI menyarankan skor per tahap. Peneliti tetap memeriksa dan memutuskan."""
    a, _ = _get_attempt(db, attempt_id)
    ins = instrument()
    lines = [SKOR_JSON, "", "PEDOMAN UMUM: " + ins["pedoman_umum"], ""]
    for item in ins["soal"]:
        lines.append(f"SOAL {item['id']} ({item['indikator']}): {item['stimulus']}")
        for i, t in enumerate(item["tahap"]):
            ans = (a.answers.get(item["id"]) or [""] * len(item["tahap"]))[i].strip() or "(kosong)"
            lines.append(
                f"  Tahap {i + 1} [maks {t['skor_maks']}] {t['pertanyaan']}\n"
                f"    KUNCI: {t['kunci']}\n    JAWABAN SISWA: {ans}"
            )
    try:
        text, p = await chat(
            s,
            "Kamu asisten penilai yang teliti dan adil.",
            [{"role": "user", "content": "\n".join(lines)}],
            json_mode=True,
            temperature=0.1,
            max_tokens=1500,
        )
        data = parse_json(text)
    except AIUnavailable as e:
        raise HTTPException(503, str(e)) from e
    except AIError as e:
        raise HTTPException(502, str(e)) from e
    mx = max_scores()
    saran: dict[str, Any] = {"soal": {}, "ringkasan": str(data.get("ringkasan", ""))[:1000]}
    for row in data.get("soal", []):
        sid = str(row.get("id", ""))
        if sid not in mx:
            continue
        raw = list(row.get("skor", []))[: len(mx[sid])]
        raw += [0] * (len(mx[sid]) - len(raw))
        vals = []
        for v, m in zip(raw, mx[sid], strict=True):
            try:
                vals.append(max(0, min(m, int(v))))
            except (TypeError, ValueError):
                vals.append(0)
        saran["soal"][sid] = {"skor": vals, "catatan": str(row.get("catatan", ""))[:500]}
    saran["provider"] = p.name
    a.ai_suggestion = saran
    db.add(a)
    db.commit()
    return saran


# ---------------------------- ekspor CSV ----------------------------
def _csv(rows: list[list[Any]], filename: str, sep: str) -> Response:
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=sep)
    w.writerows(rows)
    # BOM agar Excel membaca huruf/simbol dengan benar
    return Response(
        "﻿" + buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


Sep = Annotated[Literal[";", ","], Query(description="Pemisah kolom; Excel Indonesia memakai ;")]


@router.get("/ekspor/literasi.csv", dependencies=[Auth])
def export_literacy(db: SessionDep, sep: Sep = ";", kelas: str | None = None) -> Response:
    mx = max_scores()
    head = ["id_pengerjaan", "kode_kelas", "kode_siswa", "jenis_tes", "dikumpulkan"]
    for sid, m in mx.items():
        head += [f"{sid}_T{i + 1}" for i in range(len(m))] + [f"{sid}_total"]
    head += ["total", "maks", "nilai_0_100", "dinilai_pada", "catatan_penilai"]
    for sid, m in mx.items():
        head += [f"{sid}_jawaban_T{i + 1}" for i in range(len(m))]
    rows: list[list[Any]] = [head]
    q = select(LiteracyAttempt, Student).join(Student, Student.id == LiteracyAttempt.student_id)
    if kelas:
        q = q.where(Student.class_code == kelas.upper())
    for a, st in db.exec(q.order_by(Student.class_code, Student.student_code)).all():
        r: list[Any] = [
            a.id,
            st.class_code,
            st.student_code,
            a.test_kind,
            (a.submitted_at or a.received_at).isoformat(),
        ]
        for sid, m in mx.items():
            sc = (a.scores or {}).get(sid)
            r += list(sc) if sc else [""] * len(m)
            r.append(sum(sc) if sc else "")
        nilai = round(100 * a.total_score / a.max_score, 2) if a.total_score is not None else ""
        r += [
            a.total_score if a.total_score is not None else "",
            a.max_score,
            str(nilai).replace(".", ",") if sep == ";" else nilai,
            a.scored_at.isoformat() if a.scored_at else "",
            a.scorer_note,
        ]
        for sid, m in mx.items():
            r += list(a.answers.get(sid) or [""] * len(m))
        rows.append(r)
    return _csv(rows, "rekap-literasi.csv", sep)


@router.get("/ekspor/kejadian.csv", dependencies=[Auth])
def export_events(db: SessionDep, sep: Sep = ";", kelas: str | None = None) -> Response:
    rows: list[list[Any]] = [
        ["id", "kode_kelas", "kode_siswa", "jenis", "waktu_hp", "diterima", "data"]
    ]
    q = select(Event, Student).join(Student, Student.id == Event.student_id)
    if kelas:
        q = q.where(Student.class_code == kelas.upper())
    for e, st in db.exec(
        q.order_by(Student.class_code, Student.student_code, Event.client_ts)
    ).all():
        rows.append(
            [
                e.id,
                st.class_code,
                st.student_code,
                e.kind,
                e.client_ts.isoformat() if e.client_ts else "",
                e.received_at.isoformat(),
                json.dumps(e.data, ensure_ascii=False),
            ]
        )
    return _csv(rows, "riwayat-kejadian.csv", sep)


@router.get("/ekspor/siswa.csv", dependencies=[Auth])
def export_students(db: SessionDep, sep: Sep = ";", kelas: str | None = None) -> Response:
    data = summary(db, kelas)
    rows: list[list[Any]] = [
        [
            "kode_kelas",
            "kode_siswa",
            "terakhir_aktif",
            "aktivitas_selesai",
            "tanya_ai",
            "latihan_dicoba",
            "latihan_benar_pertama",
            "akurasi_pertama_persen",
            "miskonsepsi",
            "pretest",
            "posttest",
        ]
    ]
    for r in data["siswa"]:
        lat, lit = r["latihan"], r["literasi"]
        rows.append(
            [
                r["kode_kelas"],
                r["kode_siswa"],
                r["terakhir_aktif"],
                r["materi_selesai"],
                r["tanya_ai"],
                lat["soal_dicoba"],
                lat["benar_percobaan_pertama"],
                lat["akurasi_pertama_persen"] if lat["akurasi_pertama_persen"] is not None else "",
                " ".join(f"{k}:{v}" for k, v in lat["miskonsepsi"].items()),
                (lit["pretest"] or {}).get("total", "") if lit["pretest"] else "",
                (lit["posttest"] or {}).get("total", "") if lit["posttest"] else "",
            ]
        )
    return _csv(rows, "rekap-siswa.csv", sep)
