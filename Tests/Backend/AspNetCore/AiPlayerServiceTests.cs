using Moq;
using TicTacToe.Api.Services;

namespace TicTacToe.Api.Tests;

public class AiPlayerServiceTests
{
    private static string[] EmptyBoard() => ["", "", "", "", "", "", "", "", ""];

    [Fact]
    public async Task GetMoveAsync_ReturnsValidPosition()
    {
        var engine = new GameEngine();
        var service = new AiPlayerService(engine);
        var board = EmptyBoard();
        board[4] = "X"; // center taken

        var move = await service.GetMoveAsync(board);

        Assert.InRange(move, 0, 8);
        Assert.NotEqual(4, move);
        Assert.True(string.IsNullOrEmpty(board[move]));
    }

    [Fact]
    public async Task GetMoveAsync_OnlyOnePositionAvailable_ReturnsThatPosition()
    {
        var engine = new GameEngine();
        var service = new AiPlayerService(engine);
        // Only position 8 is available
        var board = new[] { "X", "O", "X", "O", "X", "O", "O", "X", "" };

        var move = await service.GetMoveAsync(board);

        Assert.Equal(8, move);
    }

    [Fact]
    public async Task GetMoveAsync_AlwaysReturnsAvailablePosition()
    {
        var engine = new GameEngine();
        var service = new AiPlayerService(engine);
        var board = EmptyBoard();
        board[0] = "X"; board[1] = "O"; board[2] = "X";
        board[3] = "O"; board[5] = "O";

        var available = engine.GetAvailablePositions(board);

        // Run multiple times to cover random behavior
        for (int i = 0; i < 50; i++)
        {
            var move = await service.GetMoveAsync(board);
            Assert.Contains(move, available);
        }
    }

    [Fact]
    public async Task GetMoveAsync_WithMockedEngine_ReturnsFromAvailablePositions()
    {
        var mockEngine = new Mock<IGameEngine>();
        mockEngine.Setup(e => e.GetAvailablePositions(It.IsAny<string[]>()))
            .Returns(new List<int> { 3, 7 });

        var service = new AiPlayerService(mockEngine.Object);
        var board = EmptyBoard();

        var move = await service.GetMoveAsync(board);

        Assert.True(move == 3 || move == 7);
    }
}
