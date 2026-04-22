/**
 * Mirrors Tests/Frontend/React/NewGameButton.test.tsx.
 * Expects: @src/app/components/new-game-button/new-game-button.component
 * exposes NewGameButtonComponent with output (newGame).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'

import { NewGameButtonComponent } from '@src/app/components/new-game-button/new-game-button.component'

describe('NewGameButtonComponent', () => {
  it('renders the button', async () => {
    await render(NewGameButtonComponent, { on: { newGame: vi.fn() } })
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument()
  })

  it('calls newGame when pressed', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    await render(NewGameButtonComponent, { on: { newGame: onClick } })
    await user.click(screen.getByRole('button', { name: /new game/i }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
