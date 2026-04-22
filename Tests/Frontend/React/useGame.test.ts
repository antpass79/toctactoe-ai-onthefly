import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGame } from '@src/hooks/useGame';

// Mock the gameApi module
vi.mock('@src/api/gameApi', () => ({
  postMove: vi.fn(),
  postNewGame: vi.fn(),
}));

import { postMove, postNewGame } from '@src/api/gameApi';

const mockPostMove = vi.mocked(postMove);
const mockPostNewGame = vi.mocked(postNewGame);

describe('useGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty board', () => {
    const { result } = renderHook(() => useGame());

    expect(result.current.board).toEqual(Array(9).fill(''));
    expect(result.current.status).toBe('ongoing');
    expect(result.current.winner).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.score).toEqual({ player: 0, ai: 0, draws: 0 });
  });

  it('makeMove calls API and updates board', async () => {
    mockPostMove.mockResolvedValueOnce({
      board: ['X', '', '', '', 'O', '', '', '', ''],
      aiMove: 4,
      status: 'ongoing',
      winner: null,
    });

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.makeMove(0);
    });

    expect(mockPostMove).toHaveBeenCalledWith({
      board: Array(9).fill(''),
      position: 0,
    });
    expect(result.current.board[0]).toBe('X');
    expect(result.current.board[4]).toBe('O');
    expect(result.current.status).toBe('ongoing');
    expect(result.current.isLoading).toBe(false);
  });

  it('updates score on player win', async () => {
    mockPostMove.mockResolvedValueOnce({
      board: ['X', 'X', 'X', 'O', 'O', '', '', '', ''],
      aiMove: null,
      status: 'win',
      winner: 'X',
    });

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.makeMove(2);
    });

    expect(result.current.status).toBe('win');
    expect(result.current.winner).toBe('X');
    expect(result.current.score.player).toBe(1);
  });

  it('updates score on AI win', async () => {
    mockPostMove.mockResolvedValueOnce({
      board: ['X', 'X', '', 'O', 'O', 'O', '', '', 'X'],
      aiMove: 5,
      status: 'win',
      winner: 'O',
    });

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.makeMove(8);
    });

    expect(result.current.score.ai).toBe(1);
  });

  it('updates score on draw', async () => {
    mockPostMove.mockResolvedValueOnce({
      board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
      aiMove: null,
      status: 'draw',
      winner: null,
    });

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.makeMove(8);
    });

    expect(result.current.score.draws).toBe(1);
  });

  it('newGame resets the board', async () => {
    mockPostNewGame.mockResolvedValueOnce({
      board: Array(9).fill(''),
      aiMove: null,
      status: 'ongoing',
      winner: null,
    });

    // First make a move
    mockPostMove.mockResolvedValueOnce({
      board: ['X', '', '', '', 'O', '', '', '', ''],
      aiMove: 4,
      status: 'ongoing',
      winner: null,
    });

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.makeMove(0);
    });

    expect(result.current.board[0]).toBe('X');

    // Then new game
    await act(async () => {
      await result.current.newGame();
    });

    expect(result.current.board).toEqual(Array(9).fill(''));
    expect(result.current.status).toBe('ongoing');
    expect(result.current.winner).toBeNull();
  });

  it('does not allow move when game is not ongoing', async () => {
    // First, finish the game
    mockPostMove.mockResolvedValueOnce({
      board: ['X', 'X', 'X', 'O', 'O', '', '', '', ''],
      aiMove: null,
      status: 'win',
      winner: 'X',
    });

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.makeMove(2);
    });

    // Clear mocks to verify no new call is made
    mockPostMove.mockClear();

    await act(async () => {
      await result.current.makeMove(5);
    });

    expect(mockPostMove).not.toHaveBeenCalled();
  });

  it('handles API error gracefully', async () => {
    mockPostMove.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.makeMove(0);
    });

    // Should recover from loading state
    expect(result.current.isLoading).toBe(false);
    // Board should remain unchanged
    expect(result.current.board).toEqual(Array(9).fill(''));
  });

  it('preserves score across new games', async () => {
    // Win a game
    mockPostMove.mockResolvedValueOnce({
      board: ['X', 'X', 'X', 'O', 'O', '', '', '', ''],
      aiMove: null,
      status: 'win',
      winner: 'X',
    });

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.makeMove(2);
    });

    expect(result.current.score.player).toBe(1);

    // Start new game
    mockPostNewGame.mockResolvedValueOnce({
      board: Array(9).fill(''),
      aiMove: null,
      status: 'ongoing',
      winner: null,
    });

    await act(async () => {
      await result.current.newGame();
    });

    // Score should be preserved
    expect(result.current.score.player).toBe(1);
  });
});
