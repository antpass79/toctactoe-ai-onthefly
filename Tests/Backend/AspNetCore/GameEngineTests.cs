using TicTacToe.Api.Services;

namespace TicTacToe.Api.Tests;

public class GameEngineTests
{
    private readonly GameEngine _engine = new();

    private static string[] EmptyBoard() => ["", "", "", "", "", "", "", "", ""];

    // ── Move validation ──────────────────────────────────────────────

    [Fact]
    public void IsValidMove_EmptyCell_ReturnsTrue()
    {
        var board = EmptyBoard();
        Assert.True(_engine.IsValidMove(board, 0));
    }

    [Fact]
    public void IsValidMove_OccupiedCell_ReturnsFalse()
    {
        var board = EmptyBoard();
        board[4] = "X";
        Assert.False(_engine.IsValidMove(board, 4));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(9)]
    [InlineData(100)]
    public void IsValidMove_OutOfRange_ReturnsFalse(int position)
    {
        Assert.False(_engine.IsValidMove(EmptyBoard(), position));
    }

    [Fact]
    public void IsValidMove_InvalidBoardLength_ReturnsFalse()
    {
        var board = new string[] { "", "", "" };
        Assert.False(_engine.IsValidMove(board, 0));
    }

    // ── Apply move ───────────────────────────────────────────────────

    [Fact]
    public void ApplyMove_SetsPlayerOnPosition()
    {
        var board = EmptyBoard();
        var result = _engine.ApplyMove(board, 4, "X");

        Assert.Equal("X", result[4]);
    }

    [Fact]
    public void ApplyMove_DoesNotMutateOriginalBoard()
    {
        var board = EmptyBoard();
        _engine.ApplyMove(board, 4, "X");

        Assert.Equal("", board[4]);
    }

    [Fact]
    public void ApplyMove_OtherCellsUnchanged()
    {
        var board = EmptyBoard();
        board[0] = "O";
        var result = _engine.ApplyMove(board, 4, "X");

        Assert.Equal("O", result[0]);
        Assert.Equal("X", result[4]);
        Assert.Equal("", result[8]);
    }

    // ── Win detection — horizontal ───────────────────────────────────

    [Theory]
    [InlineData(0, 1, 2)] // top row
    [InlineData(3, 4, 5)] // middle row
    [InlineData(6, 7, 8)] // bottom row
    public void GetWinner_HorizontalLine_ReturnsWinner(int a, int b, int c)
    {
        var board = EmptyBoard();
        board[a] = "X"; board[b] = "X"; board[c] = "X";
        Assert.Equal("X", _engine.GetWinner(board));
    }

    // ── Win detection — vertical ─────────────────────────────────────

    [Theory]
    [InlineData(0, 3, 6)] // left column
    [InlineData(1, 4, 7)] // middle column
    [InlineData(2, 5, 8)] // right column
    public void GetWinner_VerticalLine_ReturnsWinner(int a, int b, int c)
    {
        var board = EmptyBoard();
        board[a] = "O"; board[b] = "O"; board[c] = "O";
        Assert.Equal("O", _engine.GetWinner(board));
    }

    // ── Win detection — diagonal ─────────────────────────────────────

    [Fact]
    public void GetWinner_DiagonalTopLeftToBottomRight_ReturnsWinner()
    {
        var board = EmptyBoard();
        board[0] = "X"; board[4] = "X"; board[8] = "X";
        Assert.Equal("X", _engine.GetWinner(board));
    }

    [Fact]
    public void GetWinner_DiagonalTopRightToBottomLeft_ReturnsWinner()
    {
        var board = EmptyBoard();
        board[2] = "O"; board[4] = "O"; board[6] = "O";
        Assert.Equal("O", _engine.GetWinner(board));
    }

    // ── No winner ────────────────────────────────────────────────────

    [Fact]
    public void GetWinner_EmptyBoard_ReturnsNull()
    {
        Assert.Null(_engine.GetWinner(EmptyBoard()));
    }

    [Fact]
    public void GetWinner_PartiallyFilled_NoWin_ReturnsNull()
    {
        // X | O | X
        // O | X | O
        // O | X | O  — draw board, no winner
        var board = new[] { "X", "O", "X", "O", "X", "O", "O", "X", "O" };
        Assert.Null(_engine.GetWinner(board));
    }

    // ── Status checks ────────────────────────────────────────────────

    [Fact]
    public void CheckStatus_EmptyBoard_ReturnsOngoing()
    {
        Assert.Equal("ongoing", _engine.CheckStatus(EmptyBoard()));
    }

    [Fact]
    public void CheckStatus_WinDetected_ReturnsWin()
    {
        var board = EmptyBoard();
        board[0] = "X"; board[1] = "X"; board[2] = "X";
        Assert.Equal("win", _engine.CheckStatus(board));
    }

    [Fact]
    public void CheckStatus_DrawDetected_ReturnsDraw()
    {
        // X | O | X
        // O | X | O
        // O | X | O  — no winner, all cells filled
        var board = new[] { "X", "O", "X", "O", "X", "O", "O", "X", "O" };
        Assert.Equal("draw", _engine.CheckStatus(board));
    }

    [Fact]
    public void CheckStatus_PartiallyFilled_ReturnsOngoing()
    {
        var board = EmptyBoard();
        board[0] = "X"; board[4] = "O";
        Assert.Equal("ongoing", _engine.CheckStatus(board));
    }

    // ── Available positions ──────────────────────────────────────────

    [Fact]
    public void GetAvailablePositions_EmptyBoard_ReturnsAll9()
    {
        var positions = _engine.GetAvailablePositions(EmptyBoard());
        Assert.Equal(9, positions.Count);
        Assert.Equal(new List<int> { 0, 1, 2, 3, 4, 5, 6, 7, 8 }, positions);
    }

    [Fact]
    public void GetAvailablePositions_FullBoard_ReturnsEmpty()
    {
        var board = new[] { "X", "O", "X", "O", "X", "O", "O", "X", "O" };
        Assert.Empty(_engine.GetAvailablePositions(board));
    }

    [Fact]
    public void GetAvailablePositions_PartialBoard_ReturnsCorrectPositions()
    {
        var board = EmptyBoard();
        board[0] = "X"; board[4] = "O"; board[8] = "X";
        var positions = _engine.GetAvailablePositions(board);
        Assert.Equal(new List<int> { 1, 2, 3, 5, 6, 7 }, positions);
    }

    // ── Edge cases ───────────────────────────────────────────────────

    [Fact]
    public void GetWinner_WinOnFullBoard_ReturnsWinner()
    {
        // X | X | X
        // O | O | X
        // X | O | O
        var board = new[] { "X", "X", "X", "O", "O", "X", "X", "O", "O" };
        Assert.Equal("X", _engine.GetWinner(board));
        Assert.Equal("win", _engine.CheckStatus(board));
    }

    [Theory]
    [InlineData("X")]
    [InlineData("O")]
    public void GetWinner_AllEightWinLines_DetectsAllForPlayer(string player)
    {
        var winLines = new int[][]
        {
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        };

        foreach (var line in winLines)
        {
            var board = EmptyBoard();
            board[line[0]] = player;
            board[line[1]] = player;
            board[line[2]] = player;
            Assert.Equal(player, _engine.GetWinner(board));
        }
    }
}
