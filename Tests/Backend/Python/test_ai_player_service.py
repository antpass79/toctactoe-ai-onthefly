"""Mirrors Tests/Backend/AspNetCore/AiPlayerServiceTests.cs."""

from unittest.mock import MagicMock

import pytest

from app.services.game_engine import GameEngine
from app.services.ai_player_service import AiPlayerService


def empty_board() -> list[str]:
    return ["", "", "", "", "", "", "", "", ""]


async def test_get_move_returns_valid_position():
    engine = GameEngine()
    service = AiPlayerService(engine)
    board = empty_board()
    board[4] = "X"  # center taken

    move = await service.get_move(board)

    assert 0 <= move <= 8
    assert move != 4
    assert board[move] == ""


async def test_get_move_only_one_position_available_returns_that_position():
    engine = GameEngine()
    service = AiPlayerService(engine)
    # Only position 8 is available
    board = ["X", "O", "X", "O", "X", "O", "O", "X", ""]

    move = await service.get_move(board)

    assert move == 8


async def test_get_move_always_returns_available_position():
    engine = GameEngine()
    service = AiPlayerService(engine)
    board = empty_board()
    board[0] = "X"; board[1] = "O"; board[2] = "X"
    board[3] = "O"; board[5] = "O"

    available = engine.get_available_positions(board)

    for _ in range(50):
        move = await service.get_move(board)
        assert move in available


async def test_get_move_with_mocked_engine_returns_from_available_positions():
    mock_engine = MagicMock()
    mock_engine.get_available_positions.return_value = [3, 7]

    service = AiPlayerService(mock_engine)
    move = await service.get_move(empty_board())

    assert move in (3, 7)
