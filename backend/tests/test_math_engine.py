"""Uji mesin matematika JavaScript (frontend/src/math) lewat mesin V8 (mini-racer).

Dengan cara ini mesin matematika tetap teruji walaupun Node.js tidak terpasang.
"""

import json
import re
from pathlib import Path

import pytest
from py_mini_racer import MiniRacer

FRONTEND = Path(__file__).resolve().parents[2] / "frontend" / "src"


# Urutan penting: file yang di-import harus dimuat lebih dulu.
JS_FILES = (
    "math/linear.js",
    "math/practice.js",
    "content/keywords.js",
    "content/stories.js",
    "components/mathexpr.js",
    "components/numberline.js",
    "components/balance2d.js",
    "content/lessons.js",
)


def _load(*files: str) -> MiniRacer:
    ctx = MiniRacer()
    for f in files:
        src = (FRONTEND / f).read_text(encoding="utf-8")
        src = re.sub(r"^import\s[^\n]*;\s*$", "", src, flags=re.M)  # import satu baris dihapus
        assert not re.search(r"^\s*import\s", src, re.M), f"{f}: import harus satu baris"
        body = re.sub(r"^export\s+", "", src, flags=re.M)
        publish = "".join(f"globalThis.{n} = {n};" for n in _exports(src))
        # tiap file dibungkus fungsi agar nama pembantu (int, shuffle, …) tidak bentrok
        ctx.eval(f"(() => {{\n{body}\n{publish}\n}})()")
    return ctx


def _exports(src: str) -> list[str]:
    names = re.findall(
        r"^export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)", src, re.M
    )
    return names


@pytest.fixture(scope="module")
def js():
    ctx = _load(*JS_FILES)

    def run(expr: str):
        return json.loads(ctx.eval(f"JSON.stringify({expr})"))

    return run


def P(left, rel, right):  # noqa: N802 - singkatan soal
    return json.dumps({"left": left, "rel": rel, "right": right})


# ---------- format ----------
def test_format_uses_true_minus(js):
    assert js("fmtExpr({a:2,b:-3})") == "2x − 3"
    assert js("fmtExpr({a:-1,b:4})") == "−x + 4"
    assert js("fmtExpr({a:0,b:0})") == "0"
    assert js("fmtSide({k:-2,a:1,b:3})") == "−2(x + 3)"
    assert js("fmtNum(rat(-7,2))") == "−7/2"


# ---------- PLSV ----------
def test_solve_ax_plus_b(js):
    s = js(f"solve({P({'a': 2, 'b': 3}, '=', {'b': 11})})")
    assert s["kind"] == "one" and s["value"] == {"n": 4, "d": 1}
    assert [st["rule"] for st in s["steps"]] == ["L3", "L5"]


def test_solve_variable_both_sides(js):
    # 5x - 2 = 2x + 7  ->  x = 3
    s = js(f"solve({P({'a': 5, 'b': -2}, '=', {'a': 2, 'b': 7})})")
    assert s["value"] == {"n": 3, "d": 1}
    assert s["steps"][0]["rule"] == "L2"


def test_solve_parentheses(js):
    # 3(x + 2) = 21 -> x = 5
    s = js(f"solve({P({'k': 3, 'a': 1, 'b': 2}, '=', {'b': 21})})")
    assert s["value"] == {"n": 5, "d": 1}
    assert s["steps"][0]["rule"] == "L1"


def test_solve_non_integer_is_exact(js):
    s = js(f"solve({P({'a': 2, 'b': 0}, '=', {'b': 7})})")
    assert s["value"] == {"n": 7, "d": 2}


def test_no_solution_and_identity(js):
    assert js(f"solve({P({'a': 2, 'b': 1}, '=', {'a': 2, 'b': 5})})")["kind"] == "none"
    assert js(f"solve({P({'a': 2, 'b': 1}, '=', {'a': 2, 'b': 1})})")["kind"] == "all"


# ---------- PtLSV: aturan balik tanda ----------
def test_divide_by_negative_flips(js):
    # -2x < 6 -> x > -3
    s = js(f"solve({P({'a': -2, 'b': 0}, '<', {'b': 6})})")
    assert s["rel"] == ">" and s["value"] == {"n": -3, "d": 1}
    assert s["steps"][-1]["flipped"] is True


def test_divide_by_positive_does_not_flip(js):
    # 3x - 4 <= 5 -> x <= 3
    s = js(f"solve({P({'a': 3, 'b': -4}, '<=', {'b': 5})})")
    assert s["rel"] == "<=" and s["value"] == {"n": 3, "d": 1}
    assert not any(st["flipped"] for st in s["steps"])


def test_adding_negative_does_not_flip(js):
    # x + 5 > 2 -> x > -3 (menambah/mengurangi tidak pernah membalik tanda)
    s = js(f"solve({P({'a': 1, 'b': 5}, '>', {'b': 2})})")
    assert s["rel"] == ">" and s["value"] == {"n": -3, "d": 1}


def test_check_against_original(js):
    p = P({"a": -2, "b": 0}, "<", {"b": 6})
    assert js(f"check({p}, 0)") is True
    assert js(f"check({p}, -3)") is False
    assert js(f"check({p}, -4)") is False


def test_interval(js):
    assert js("toInterval('<=', 3)") == {
        "type": "ray",
        "boundary": 3,
        "closed": True,
        "dir": "left",
    }
    assert js("toInterval('>', -1)")["closed"] is False


# ---------- miskonsepsi ----------
def test_diagnose(js):
    neg = P({"a": -2, "b": 0}, "<", {"b": 6})
    assert js(f"diagnose({neg}, {{rel:'>', value:-3}})")["ok"] is True
    assert js(f"diagnose({neg}, {{rel:'<', value:-3}})")["code"] == "M2"
    pos = P({"a": 3, "b": -4}, "<=", {"b": 5})
    assert js(f"diagnose({pos}, {{rel:'>=', value:3}})")["code"] == "M3"
    assert js(f"diagnose({pos}, {{rel:'<', value:3}})")["code"] == "M4"
    eq = P({"a": 2, "b": 3}, "=", {"b": 11})
    assert js(f"diagnose({eq}, {{rel:'=', value:7}})")["code"] == "M6"
    assert js(f"diagnose({eq}, {{rel:'=', value:5}})")["code"] == "value"


# ---------- generator ----------
@pytest.mark.parametrize("form", ["x+b=c", "ax=c", "ax+b=c", "ax+b=cx+d", "a(x+b)=c"])
@pytest.mark.parametrize("kind", ["PLSV", "PtLSV"])
def test_generator_integer_solutions(js, form, kind):
    res = js(
        f"""Array.from({{length:200}}, (_, i) => {{
            const p = generate('{form}', {{type:'{kind}', seed:i+1}});
            const s = solve(p);
            // jawaban benar  ⇔  setiap bilangan uji memenuhi soal awal tepat ketika memenuhi jawaban
            let ok = s.kind === 'one';
            for (let t = -12; ok && t <= 12; t++) ok = check(p, t) === holds(s.rel, t, s.value);
            return {{kind: s.kind, d: s.value && s.value.d, n: s.value && s.value.n, ok}};
        }})"""
    )
    for r in res:
        assert r["kind"] == "one"
        assert r["d"] == 1
        assert -9 <= r["n"] <= 9
        assert r["ok"]


def test_generator_is_deterministic(js):
    assert js("generate('ax+b=c',{seed:42})") == js("generate('ax+b=c',{seed:42})")


# ---------- kata kunci ----------
def test_keywords_longest_match(js):
    found = js("findKeywords('Beratnya tidak lebih dari 50 kg')")
    assert [(f["phrase"], f["rel"]) for f in found] == [("tidak lebih dari", "<=")]


def test_keywords_multiple(js):
    found = js("findKeywords('Rani membeli paling banyak 4 buku, minimal 1 pulpen')")
    assert [f["rel"] for f in found] == ["<=", ">="]


# ---------- Cek Prasyarat ----------
def test_prereq_quiz_structure(js):
    for seed in range(1, 60):
        qs = js(f"prereqQuiz({seed})")
        assert len(qs) == 8
        assert [q["cat"] for q in qs].count("bulat") == 3
        for q in qs:
            assert len(q["options"]) == 4
            keys = {(o.get("a", 0), o.get("b", 0)) for o in q["options"]}
            assert len(keys) == 4, q
            assert 0 <= q["answer"] < 4


def test_prereq_answers_are_correct(js):
    # hitung ulang jawaban dari teks soal untuk soal bilangan bulat
    res = js(
        """Array.from({length:80}, (_, s) => prereqQuiz(s + 1).filter(q => q.cat === 'bulat').map(q => {
            const expr = q.prompt.replace(/\\u2212/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
            return { want: Function('return ' + expr)(), got: q.options[q.answer].b || 0 };
        })).flat()"""
    )
    for r in res:
        assert r["want"] == r["got"]


def test_prereq_summary_weak_rule(js):
    out = js(
        "(() => { const qs = prereqQuiz(3); const picks = qs.map((q,i) => i < 2 ? (q.answer+1)%4 : q.answer); return prereqSummary(qs, picks); })()"
    )
    assert out["bulat"] == {"total": 3, "correct": 1, "weak": True}
    assert out["sejenis"]["weak"] is False


# ---------- Latihan Mandiri ----------
@pytest.mark.parametrize("level", ["mudah", "sedang", "sulit"])
@pytest.mark.parametrize("kind", ["PLSV", "PtLSV", "campur"])
def test_practice_problems_solvable(js, level, kind):
    res = js(
        f"""Array.from({{length:100}}, (_, i) => {{
            const p = practiceProblem('{level}', '{kind}', i + 1); const s = solve(p); const h = hintFor(p);
            return {{ kind: s.kind, d: s.value.d, form: p.form, type: p.type, arah: h.arah }};
        }})"""
    )
    forms = {"mudah": {"x+b=c", "ax=c"}, "sedang": {"ax+b=c"}, "sulit": {"ax+b=cx+d", "a(x+b)=c"}}[
        level
    ]
    for r in res:
        assert r["kind"] == "one" and r["d"] == 1
        assert r["form"] in forms
        assert r["arah"]
        if kind != "campur":
            assert r["type"] == kind


# ---------- Soal cerita ----------
def test_stories_consistent(js):
    res = js(
        """Array.from({length: STORY_COUNT * 60}, (_, i) => {
            const s = makeStory(i % STORY_COUNT, i + 1);
            const text = s.sentences.map(x => x.text).join(' ');
            const kws = findKeywords(text);
            const v = s.value;
            // jawaban tafsiran: bilangan cacah yang benar untuk konteks
            const m = s.model;
            const ok = (t) => check(m, t);
            let N = null;
            if (m.rel === '=') N = v.n / v.d;
            else if (m.rel === '<=') { N = Math.floor(v.n / v.d); }
            else if (m.rel === '>=') { N = Math.ceil(v.n / v.d); }
            return {
                asked: s.sentences.filter(x => x.role === 'asked').length,
                extra: s.sentences.filter(x => x.role === 'extra').length,
                kwRels: kws.map(k => k.rel), rel: m.rel, kwInText: text.toLowerCase().includes(s.keyword),
                slotOk: ['x','c','r','rel'].every(k => s.slots[k].options[s.slots[k].answer] !== undefined
                        && new Set(s.slots[k].options).size === s.slots[k].options.length),
                modelMatches: s.slots.x.options[s.slots.x.answer] === m.left.a && s.slots.c.options[s.slots.c.answer] === m.left.b
                        && s.slots.r.options[s.slots.r.answer] === m.right.b,
                varOk: s.variable.options.length >= 2 && s.variable.answer >= 0,
                interpOk: s.interpret.options.length >= 2 && s.interpret.options[s.interpret.answer].includes(String(N)),
                nOk: Number.isInteger(N) && ok(N) && (m.rel !== '<=' || !ok(N + 1)) && (m.rel !== '>=' || !ok(N - 1)),
            };
        })"""
    )
    for r in res:
        assert r["asked"] == 1 and r["extra"] >= 1
        assert r["kwInText"]
        assert r["kwRels"] and all(k == r["rel"] for k in r["kwRels"]), r
        assert r["slotOk"] and r["modelMatches"] and r["varOk"]
        assert r["interpOk"] and r["nOk"], r


# ---------- Materi ----------
def test_lessons_structure(js):
    res = js(
        """LESSONS.map(l => ({
            id: l.id, pages: l.pages.length,
            bodiesOk: l.pages.every(p => typeof p.title === 'string' && (typeof p.body === 'string' || p.example)),
            examples: l.pages.filter(p => p.example).map(p => { const s = solve(p.example); return { kind: s.kind, steps: s.steps.length }; }),
            check: l.check ? { n: l.check.options.length, a: l.check.answer, uniq: new Set(l.check.options).size } : null,
        }))"""
    )
    assert len(res) == 10
    assert len({r["id"] for r in res}) == 10
    for r in res:
        assert r["pages"] >= 2 and r["bodiesOk"], r["id"]
        for ex in r["examples"]:
            assert ex["kind"] == "one" and ex["steps"] >= 1, r["id"]
        if r["check"]:
            assert (
                0 <= r["check"]["a"] < r["check"]["n"] and r["check"]["uniq"] == r["check"]["n"]
            ), r["id"]


def test_lesson_worked_answers_match_text(js):
    # jawaban yang ditulis manual di materi harus sama dengan hasil mesin
    cases = {
        "{left:{a:4,b:1},rel:'=',right:{b:13}}": ("=", 3, 1),
        "{left:{a:-3},rel:'<',right:{b:12}}": (">", -4, 1),
        "{left:{a:-1,b:5},rel:'>',right:{b:2}}": ("<", 3, 1),
        "{left:{a:12,b:8},rel:'<=',right:{b:50}}": ("<=", 7, 2),
        "{left:{a:-2,b:4},rel:'<',right:{b:10}}": (">", -3, 1),
        "{left:{a:1,b:7},rel:'>=',right:{a:3,b:1}}": ("<=", 3, 1),
        "{left:{a:5,b:-2},rel:'=',right:{a:2,b:7}}": ("=", 3, 1),
        "{left:{k:2,a:1,b:3},rel:'=',right:{b:14}}": ("=", 4, 1),
    }
    for prob, (rel, n, d) in cases.items():
        s = js(f"solve({prob})")
        assert (s["rel"], s["value"]["n"], s["value"]["d"]) == (rel, n, d), prob
