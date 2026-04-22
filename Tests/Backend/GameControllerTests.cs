using Microsoft.AspNetCore.Mvc;
using Moq;
using TicTacToe.Api.Controllers;
using TicTacToe.Api.Models;
using TicTacToe.Api.Services;

namespace TicTacToe.Api.Tests;

public class GameControllerTests
{
    private readonly GameEngine _engine = new();

    private GameController CreateController(IAiPlayerService? aiPlayer = null)
    {
        var ai = aiPlayer ?? CreateMockAi(5); // default AI picks position 5
        return new GameController(_engine, ai);
    }

    private static IAiPlayerService CreateMockAi(int movePosition)
    {
        var mock = new Mock<IAiPlayerService>();
        mock.Setup(a => a.GetMoveAsync(It.IsAny<string[]>()))
            .ReturnsAsync(movePosition);
        return mock.Object;
    }

    private static string[] EmptyBoard() => ["", "", "", "", "", "", "", "", ""];

    // ── NewGame ──────────────────────────────────────────────────────

    [Fact]
    public void NewGame_ReturnsEmptyBoard()
    {
        var controller = CreateController();
        var result = controller.NewGame();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<MoveResponse>(ok.Value);

        Assert.All(response.Board, cell => Assert.Equal("", cell));
        Assert.Equal(9, response.Board.Length);
        Assert.Equal("ongoing", response.Status);
        Assert.Null(response.Winner);
        Assert.Null(response.AiMove);
    }

    // ── Valid move — game continues ──────────────────────────────────

    [Fact]
    public async Task MakeMove_ValidMove_ReturnsUpdatedBoardWithAiMove()
    {
        var controller = CreateController(CreateMockAi(5));

        var request = new MoveRequest
        {
            Board = EmptyBoard(),
            Position = 0
        };

        var result = await controller.MakeMove(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<MoveResponse>(ok.Value);

        Assert.Equal("X", response.Board[0]); // player move
        Assert.Equal("O", response.Board[5]); // AI move
        Assert.Equal(5, response.AiMove);
        Assert.Equal("ongoing", response.Status);
        Assert.Null(response.Winner);
    }

    // ── Player wins — no AI move ─────────────────────────────────────

    [Fact]
    public async Task MakeMove_PlayerWins_ReturnsWinStatus()
    {
        var controller = CreateController();

        // X at 0,1 — player about to play 2 for top-row win
        var board = EmptyBoard();
        board[0] = "X"; board[1] = "X";
        board[3] = "O"; board[4] = "O";

        var request = new MoveRequest { Board = board, Position = 2 };
        var result = await controller.MakeMove(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<MoveResponse>(ok.Value);

        Assert.Equal("win", response.Status);
        Assert.Equal("X", response.Winner);
        Assert.Null(response.AiMove); // no AI move when player wins
    }

    // ── Draw scenario ────────────────────────────────────────────────

    [Fact]
    public async Task MakeMove_DrawAfterPlayerMove_ReturnsDrawStatus()
    {
        var controller = CreateController();

        // Board almost full, player fills last cell, no winner
        // X | O | X
        // X | O | O
        // O | X | _   ← position 8
        var board = new[] { "X", "O", "X", "X", "O", "O", "O", "X", "" };

        var request = new MoveRequest { Board = board, Position = 8 };
        var result = await controller.MakeMove(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<MoveResponse>(ok.Value);

        // After placing X at 8: board is full with no winner → draw
        // But wait, let's check: does X win with position 8? No.
        // So status should be "draw"
        Assert.Equal("draw", response.Status);
        Assert.Null(response.Winner);
    }

    // ── Invalid move — occupied cell ─────────────────────────────────

    [Fact]
    public async Task MakeMove_OccupiedCell_ReturnsBadRequest()
    {
        var controller = CreateController();

        var board = EmptyBoard();
        board[4] = "X";

        var request = new MoveRequest { Board = board, Position = 4 };
        var result = await controller.MakeMove(request);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    // ── Game already over ────────────────────────────────────────────

    [Fact]
    public async Task MakeMove_GameAlreadyWon_ReturnsBadRequest()
    {
        var controller = CreateController();

        // X already won (top row)
        var board = EmptyBoard();
        board[0] = "X"; board[1] = "X"; board[2] = "X";
        board[3] = "O"; board[4] = "O";

        var request = new MoveRequest { Board = board, Position = 5 };
        var result = await controller.MakeMove(request);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    // ── Invalid board content ────────────────────────────────────────

    [Fact]
    public async Task MakeMove_InvalidBoardContent_ReturnsBadRequest()
    {
        var controller = CreateController();

        var board = EmptyBoard();
        board[0] = "Z"; // invalid

        var request = new MoveRequest { Board = board, Position = 1 };
        var result = await controller.MakeMove(request);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    // ── AI move after player move ────────────────────────────────────

    [Fact]
    public async Task MakeMove_AfterPlayerMove_AiPlays()
    {
        var mockAi = new Mock<IAiPlayerService>();
        mockAi.Setup(a => a.GetMoveAsync(It.IsAny<string[]>()))
            .ReturnsAsync(4);

        var controller = new GameController(_engine, mockAi.Object);

        var request = new MoveRequest { Board = EmptyBoard(), Position = 0 };
        var result = await controller.MakeMove(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<MoveResponse>(ok.Value);

        Assert.Equal("X", response.Board[0]);
        Assert.Equal("O", response.Board[4]);
        Assert.Equal(4, response.AiMove);

        mockAi.Verify(a => a.GetMoveAsync(It.IsAny<string[]>()), Times.Once);
    }

    // ── AI wins scenario ─────────────────────────────────────────────

    [Fact]
    public async Task MakeMove_AiCompletesWin_ReturnsAiWin()
    {
        // After player moves, the AI will be set up to complete a winning line
        // Board: O at 0, 3 — AI will play at 6 to win left column
        var board = EmptyBoard();
        board[0] = "O"; board[3] = "O";
        board[1] = "X"; board[4] = "X";
        // Player plays at 8, then AI plays at 6

        var mockAi = new Mock<IAiPlayerService>();
        mockAi.Setup(a => a.GetMoveAsync(It.IsAny<string[]>()))
            .ReturnsAsync(6);

        var controller = new GameController(_engine, mockAi.Object);
        var request = new MoveRequest { Board = board, Position = 8 };
        var result = await controller.MakeMove(request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<MoveResponse>(ok.Value);

        Assert.Equal("win", response.Status);
        Assert.Equal("O", response.Winner);
        Assert.Equal(6, response.AiMove);
    }
}
