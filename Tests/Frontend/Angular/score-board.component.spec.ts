/**
 * Mirrors Tests/Frontend/React/ScoreBoard.test.tsx.
 * Expects: @src/app/components/score-board/score-board.component exposes
 * ScoreBoardComponent with input { score: { player, ai, draws } }.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/angular'

import { ScoreBoardComponent } from '@src/app/components/score-board/score-board.component'

describe('ScoreBoardComponent', () => {
  it('renders initial scores as 0', async () => {
    await render(ScoreBoardComponent, { inputs: { score: { player: 0, ai: 0, draws: 0 } } })
    expect(screen.getByText(/Player: 0/)).toBeInTheDocument()
    expect(screen.getByText(/AI: 0/)).toBeInTheDocument()
    expect(screen.getByText(/Draws: 0/)).toBeInTheDocument()
  })

  it('renders updated scores', async () => {
    await render(ScoreBoardComponent, { inputs: { score: { player: 3, ai: 1, draws: 2 } } })
    expect(screen.getByText(/Player: 3/)).toBeInTheDocument()
    expect(screen.getByText(/AI: 1/)).toBeInTheDocument()
    expect(screen.getByText(/Draws: 2/)).toBeInTheDocument()
  })
})
