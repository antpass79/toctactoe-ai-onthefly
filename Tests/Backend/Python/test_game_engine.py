"""Mirrors Tests/Backend/AspNetCore/GameEngineTests.cs."""

import pytest

from app.services.game_engine import GameEngine


def empty_board() -> list[str]:
    return ["", "", "", "", "", "", "", "", ""]


@pytest.fixture
def engine() -> GameEngine:
    return GameEngine()


# ── Move validation ──────────────────────────────────────────────

def test_is_valid_move_empty_cell_returns_true(engine):
    assert engine.is_valid_move(empty_board(), 0) is True


def test_is_valid_move_occupied_cell_returns_false(engine):
    board = empty_board()
    board[4] = "X"
    assert engine.is_valid_move(board, 4) is False


@pytest.mark.parametrize("position", [-1, 9, 100])
def test_is_valid_move_out_of_range_returns_false(engine, position):
    assert engine.is_valid_move(empty_board(), position) is False


def test_is_valid_move_invalid_board_length_returns_false(engine):
    assert engine.is_valid_move(["", "", ""], 0) is False


# ── Apply move ───────────────────────────────────────────────────

def test_apply_move_sets_player_on_position(engine):
    result = engine.apply_move(empty_board(), 4, "X")
    assert result[4] == "X"


def test_apply_move_does_not_mutate_original_board(engine):
    board = empty_board()
    engine.apply_move(board, 4, "X")
    assert board[4] == ""


def test_apply_move_other_cells_unchanged(engine):
    board = empty_board()
    board[0] = "O"
    result = engine.apply_move(board, 4, "X")
    assert result[0] == "O"
    assert result[4] == "X"
    assert result[8] == ""


# ── Win detection — horizontal ───────────────────────────────────

@pytest.mark.parametrize("a,b,c", [(0, 1, 2), (3, 4, 5), (6, 7, 8)])
def test_get_winner_horizontal_line_returns_winner(engine, a, b, c):
    board = empty_board()
    board[a] = board[b] = board[c] = "X"
    assert engine.get_winner(board) == "X"


# ── Win detection — vertical ─────────────────────────────────────

@pytest.mark.parametrize("a,b,c", [(0, 3, 6), (1, 4, 7), (2, 5, 8)])
def test_get_winner_vertical_line_returns_winner(engine, a, b, c):
    board = empty_board()
    board[a] = board[b] = board[c] = "O"
    assert engine.get_winner(board) == "O"


# ── Win detection — diagonal ─────────────────────────────────────

def test_get_winner_diagonal_tl_br_returns_winner(engine):
    board = empty_board()
    board[0] = board[4] = board[8] = "X"
    assert engine.get_winner(board) == "X"


def test_get_winner_diagonal_tr_bl_returns_winner(engine):
    board = empty_board()
    board[2] = board[4] = board[6] = "O"
    assert engine.get_winner(board) == "O"


# ── No winner ────────────────────────────────────────────────────

def test_get_winner_empty_board_returns_none(engine):
    assert engine.get_winner(empty_board()) is None


def test_get_winner_partially_filled_no_win_returns_none(engine):
    board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"]
    assert engine.get_winner(board) is None


# ── Status checks ────────────────────────────────────────────────

def test_check_status_empty_board_returns_ongoing(engine):
    assert engine.check_status(empty_board()) == "ongoing"


def test_check_status_win_detected_returns_win(engine):
    board = empty_board()
    board[0] = board[1] = board[2] = "X"
    assert engine.check_status(board) == "win"


def test_check_status_draw_detected_returns_draw(engine):
    board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"]
    assert engine.check_status(board) == "draw"


def test_check_status_partially_filled_returns_ongoing(engine):
    board = empty_board()
    board[0] = "X"
    board[4] = "O"
    assert engine.check_status(board) == "ongoing"


# ── Available positions ──────────────────────────────────────────

def test_get_available_positions_empty_board_returns_all_9(engine):
    assert engine.get_available_positions(empty_board()) == [0, 1, 2, 3, 4, 5, 6, 7, 8]


def test_get_available_positions_full_board_returns_empty(engine):
    board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"]
    assert engine.get_available_positions(board) == []


def test_get_available_positions_partial_board_returns_correct_positions(engine):
    board = empty_board()
    board[0] = "X"
    board[4] = "O"
    board[8] = "X"
    assert engine.get_available_positions(board) == [1, 2, 3, 5, 6, 7]


# ── Edge cases ───────────────────────────────────────────────────

def test_get_winner_win_on_full_board_returns_winner(engine):
    board = ["X", "X", "X", "O", "O", "X", "X", "O", "O"]
    assert engine.get_winner(board) == "X"
    assert engine.check_status(board) == "win"


@pytest.mark.parametrize("player", ["X", "O"])
def test_get_winner_all_eight_win_lines_detects_all_for_player(engine, player):
    win_lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ]
    for line in win_lines:
        board = empty_board()
        for idx in line:
            board[idx] = player
        assert engine.get_winner(board) == player
