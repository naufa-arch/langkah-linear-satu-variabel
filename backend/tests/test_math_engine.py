"""Uji mesin matematika JavaScript (frontend/src/math) lewat mesin V8 (mini-racer).

Dengan cara ini mesin matematika tetap teruji walaupun Node.js tidak terpasang.
"""

import json
import re
from pathlib import Path

import pytest
from py_mini_racer import MiniRacer

FRONTEND = Path(__file__).resolve().parents[2] / "frontend" / "src"


def _load(*files: str) -> MiniRacer:
    ctx = MiniRacer()
    for f in files:
        src = (FRONTEND / f).read_text(encoding="utf-8")
        assert not re.search(r"^\s*import\s", src, re.M), f"{f} tidak boleh memakai import"
        ctx.eval(re.sub(r"^export\s+", "", src, flags=re.M))
    return ctx


@pytest.fixture(scope="module")
def js():
    ctx = _load("math/linear.js", "content/keywords.js")

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
