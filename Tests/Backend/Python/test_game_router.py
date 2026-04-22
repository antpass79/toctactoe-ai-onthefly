"""Mirrors Tests/Backend/AspNetCore/GameControllerTests.cs.

Uses FastAPI's TestClient to exercise the /api/game/* endpoints.
The AiPlayerService is overridden via FastAPI dependency_overrides so
AI moves are deterministic (like the Moq-based C# tests).
"""

from typing import Iterable

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.ai_player_service import AiPlayerService
from app.services.game_engine import GameEngine
from app.routers.game import get_ai_player_service


def empty_board() -> list[str]:
    return ["", "", "", "", "", "", "", "", ""]


class StubAi(AiPlayerService):
    """Deterministic AI stub: returns the next position from a queue."""

    def __init__(self, moves: Iterable[int]):
        self._moves = list(moves)
        self.calls = 0

    async def get_move(self, board: list[str]) -> int:  # type: ignore[override]
        self.calls += 1
        return self._moves.pop(0)


@pytest.fixture
def client_factory():
    """Factory that returns (TestClient, StubAi) with a given scripted AI."""

    def _make(ai_moves: Iterable[int] = (5,)) -> tuple[TestClient, StubAi]:
        stub = StubAi(ai_moves)
        app.dependency_overrides[get_ai_player_service] = lambda: stub
        return TestClient(app), stub

    yield _make
    app.dependency_overrides.clear()


# ── NewGame ──────────────────────────────────────────────────────

def test_new_game_returns_empty_board(client_factory):
    client, _ = client_factory()
    r = client.post("/api/game/new")
    assert r.status_code == 200
    body = r.json()
    assert body["board"] == empty_board()
    assert len(body["board"]) == 9
    assert body["status"] == "ongoing"
    assert body["winner"] is None
    assert body["ai_move"] is None


# ── Valid move — game continues ──────────────────────────────────

def test_make_move_valid_move_returns_updated_board_with_ai_move(client_factory):
    client, _ = client_factory(ai_moves=[5])
    r = client.post("/api/game/move", json={"board": empty_board(), "position": 0})
    assert r.status_code == 200
    body = r.json()
    assert body["board"][0] == "X"
    assert body["board"][5] == "O"
    assert body["ai_move"] == 5
    assert body["status"] == "ongoing"
    assert body["winner"] is None


# ── Player wins — no AI move ─────────────────────────────────────

def test_make_move_player_wins_returns_win_status(client_factory):
    client, stub = client_factory()
    board = empty_board()
    board[0] = "X"; board[1] = "X"
    board[3] = "O"; board[4] = "O"

    r = client.post("/api/game/move", json={"board": board, "position": 2})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "win"
    assert body["winner"] == "X"
    assert body["ai_move"] is None
    assert stub.calls == 0


# ── Draw scenario ────────────────────────────────────────────────

def test_make_move_draw_after_player_move_returns_draw_status(client_factory):
    client, _ = client_factory()
    board = ["X", "O", "X", "X", "O", "O", "O", "X", ""]

    r = client.post("/api/game/move", json={"board": board, "position": 8})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "draw"
    assert body["winner"] is None


# ── Invalid move — occupied cell ─────────────────────────────────

def test_make_move_occupied_cell_returns_bad_request(client_factory):
    client, _ = client_factory()
    board = empty_board()
    board[4] = "X"
    r = client.post("/api/game/move", json={"board": board, "position": 4})
    assert r.status_code == 400


# ── Game already over ────────────────────────────────────────────

def test_make_move_game_already_won_returns_bad_request(client_factory):
    client, _ = client_factory()
    board = empty_board()
    board[0] = "X"; board[1] = "X"; board[2] = "X"
    board[3] = "O"; board[4] = "O"
    r = client.post("/api/game/move", json={"board": board, "position": 5})
    assert r.status_code == 400


# ── Invalid board content ────────────────────────────────────────

def test_make_move_invalid_board_content_returns_bad_request(client_factory):
    client, _ = client_factory()
    board = empty_board()
    board[0] = "Z"
    r = client.post("/api/game/move", json={"board": board, "position": 1})
    # Pydantic validation error -> 422, or explicit 400 from router
    assert r.status_code in (400, 422)


# ── AI move after player move ────────────────────────────────────

def test_make_move_after_player_move_ai_plays(client_factory):
    client, stub = client_factory(ai_moves=[4])
    r = client.post("/api/game/move", json={"board": empty_board(), "position": 0})
    assert r.status_code == 200
    body = r.json()
    assert body["board"][0] == "X"
    assert body["board"][4] == "O"
    assert body["ai_move"] == 4
    assert stub.calls == 1


# ── AI wins scenario ─────────────────────────────────────────────

def test_make_move_ai_completes_win_returns_ai_win(client_factory):
    client, _ = client_factory(ai_moves=[6])
    board = empty_board()
    board[0] = "O"; board[3] = "O"
    board[1] = "X"; board[4] = "X"

    r = client.post("/api/game/move", json={"board": board, "position": 8})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "win"
    assert body["winner"] == "O"
    assert body["ai_move"] == 6
