/**
 * Mirrors Tests/Frontend/React/useGame.test.ts.
 *
 * Expected module shape at @src/app/store/game.store:
 *   - `createGameStore()` returns a *fresh* vanilla Zustand store
 *     (https://zustand.docs.pmnd.rs/guides/flux-inspired-practice#vanilla-store)
 *     with state: board, status, winner, isLoading, score
 *     and actions: makeMove(position), newGame()
 *
 * Expected module shape at @src/app/api/game-api.service:
 *   - exports `postMove(req)` and `postNewGame()` (the store uses these
 *     internally). We stub them via vi.mock so the store is tested in
 *     isolation from HTTP.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@src/app/api/game-api.service', () => ({
  postMove: vi.fn(),
  postNewGame: vi.fn(),
}))

import { createGameStore } from '@src/app/store/game.store'
import { postMove, postNewGame } from '@src/app/api/game-api.service'

const mockPostMove = vi.mocked(postMove)
const mockPostNewGame = vi.mocked(postNewGame)

describe('gameStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty board', () => {
    const store = createGameStore()
    const s = store.getState()
    expect(s.board).toEqual(Array(9).fill(''))
    expect(s.status).toBe('ongoing')
    expect(s.winner).toBeNull()
    expect(s.isLoading).toBe(false)
    expect(s.score).toEqual({ player: 0, ai: 0, draws: 0 })
  })

  it('makeMove calls API and updates board', async () => {
    mockPostMove.mockResolvedValueOnce({
      board: ['X', '', '', '', 'O', '', '', '', ''],
      aiMove: 4,
      status: 'ongoing',
      winner: null,
    })
    const store = createGameStore()
    await store.getState().makeMove(0)

    expect(mockPostMove).toHaveBeenCalledWith({ board: Array(9).fill(''), position: 0 })
    const s = store.getState()
    expect(s.board[0]).toBe('X')
    expect(s.board[4]).toBe('O')
    expect(s.status).toBe('ongoing')
    expect(s.isLoading).toBe(false)
  })

  it('updates score on player win', async () => {
    mockPostMove.mockResolvedValueOnce({
      board: ['X', 'X', 'X', 'O', 'O', '', '', '', ''],
      aiMove: null,
      status: 'win',
      winner: 'X',
    })
    const store = createGameStore()
    await store.getState().makeMove(2)

    const s = store.getState()
    expect(s.status).toBe('win')
    expect(s.winner).toBe('X')
    expect(s.score.player).toBe(1)
  })

  it('updates score on AI win', async () => {
    mockPostMove.mockResolvedValueOnce({
      board: ['X', 'X', '', 'O', 'O', 'O', '', '', 'X'],
      aiMove: 5,
      status: 'win',
      winner: 'O',
    })
    const store = createGameStore()
    await store.getState().makeMove(8)
    expect(store.getState().score.ai).toBe(1)
  })

  it('updates score on draw', async () => {
    mockPostMove.mockResolvedValueOnce({
      board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
      aiMove: null,
      status: 'draw',
      winner: null,
    })
    const store = createGameStore()
    await store.getState().makeMove(8)
    expect(store.getState().score.draws).toBe(1)
  })

  it('newGame resets the board', async () => {
    mockPostMove.mockResolvedValueOnce({
      board: ['X', '', '', '', 'O', '', '', '', ''],
      aiMove: 4,
      status: 'ongoing',
      winner: null,
    })
    mockPostNewGame.mockResolvedValueOnce({
      board: Array(9).fill(''),
      aiMove: null,
      status: 'ongoing',
      winner: null,
    })

    const store = createGameStore()
    await store.getState().makeMove(0)
    expect(store.getState().board[0]).toBe('X')

    await store.getState().newGame()
    const s = store.getState()
    expect(s.board).toEqual(Array(9).fill(''))
    expect(s.status).toBe('ongoing')
    expect(s.winner).toBeNull()
  })

  it('does not allow move when game is not ongoing', async () => {
    mockPostMove.mockResolvedValueOnce({
      board: ['X', 'X', 'X', 'O', 'O', '', '', '', ''],
      aiMove: null,
      status: 'win',
      winner: 'X',
    })
    const store = createGameStore()
    await store.getState().makeMove(2)

    mockPostMove.mockClear()
    await store.getState().makeMove(5)
    expect(mockPostMove).not.toHaveBeenCalled()
  })

  it('handles API error gracefully', async () => {
    mockPostMove.mockRejectedValueOnce(new Error('Network error'))
    const store = createGameStore()
    await store.getState().makeMove(0)

    const s = store.getState()
    expect(s.isLoading).toBe(false)
    expect(s.board).toEqual(Array(9).fill(''))
  })

  it('preserves score across new games', async () => {
    mockPostMove.mockResolvedValueOnce({
      board: ['X', 'X', 'X', 'O', 'O', '', '', '', ''],
      aiMove: null,
      status: 'win',
      winner: 'X',
    })
    const store = createGameStore()
    await store.getState().makeMove(2)
    expect(store.getState().score.player).toBe(1)

    mockPostNewGame.mockResolvedValueOnce({
      board: Array(9).fill(''),
      aiMove: null,
      status: 'ongoing',
      winner: null,
    })
    await store.getState().newGame()
    expect(store.getState().score.player).toBe(1)
  })
})
