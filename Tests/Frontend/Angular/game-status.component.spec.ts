/**
 * Mirrors Tests/Frontend/React/GameStatus.test.tsx.
 * Expects: @src/app/components/game-status/game-status.component exposes
 * GameStatusComponent with inputs { status, winner, isLoading }.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/angular'

import { GameStatusComponent } from '@src/app/components/game-status/game-status.component'

describe('GameStatusComponent', () => {
  it('shows "Your turn" when ongoing', async () => {
    await render(GameStatusComponent, {
      inputs: { status: 'ongoing', winner: null, isLoading: false },
    })
    expect(screen.getByRole('status')).toHaveTextContent('Your turn')
  })

  it('shows "AI is thinking..." when loading', async () => {
    await render(GameStatusComponent, {
      inputs: { status: 'ongoing', winner: null, isLoading: true },
    })
    expect(screen.getByRole('status')).toHaveTextContent('AI is thinking...')
  })

  it('shows "You win!" when player wins', async () => {
    await render(GameStatusComponent, {
      inputs: { status: 'win', winner: 'X', isLoading: false },
    })
    expect(screen.getByRole('status')).toHaveTextContent('You win!')
  })

  it('shows "AI wins!" when AI wins', async () => {
    await render(GameStatusComponent, {
      inputs: { status: 'win', winner: 'O', isLoading: false },
    })
    expect(screen.getByRole('status')).toHaveTextContent('AI wins!')
  })

  it("shows \"It's a draw!\" when draw", async () => {
    await render(GameStatusComponent, {
      inputs: { status: 'draw', winner: null, isLoading: false },
    })
    expect(screen.getByRole('status')).toHaveTextContent("It's a draw!")
  })

  it('shows loading message over win status', async () => {
    await render(GameStatusComponent, {
      inputs: { status: 'win', winner: 'X', isLoading: true },
    })
    expect(screen.getByRole('status')).toHaveTextContent('AI is thinking...')
  })
})
