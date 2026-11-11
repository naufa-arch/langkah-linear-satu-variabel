from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok() -> None:
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert "version" in body


def test_cors_allows_frontend_dev_origin() -> None:
    res = client.options(
        "/api/v1/health",
        headers={"Origin": "http://localhost:8000", "Access-Control-Request-Method": "GET"},
    )
    assert res.headers.get("access-control-allow-origin") == "http://localhost:8000"


def test_cors_blocks_unknown_origin() -> None:
    res = client.options(
        "/api/v1/health",
        headers={"Origin": "https://contoh-asing.example", "Access-Control-Request-Method": "GET"},
    )
    assert "access-control-allow-origin" not in res.headers
