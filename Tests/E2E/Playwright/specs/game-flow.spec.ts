/**
 * Deterministic game-flow tests. The backend is route-mocked so we can
 * assert exact board states, win/draw messaging, and score updates.
 */
import { test, expect } from '@playwright/test'
import { cell, clickCell, gotoApp, mockBackend } from './helpers'

test.describe('game flow (mocked backend)', () => {
  test('player makes a move; AI replies in the center', async ({ page }) => {
    await mockBackend(page, {
      moveQueue: [
        {
          board: ['X', '', '', '', 'O', '', '', '', ''],
          ai_move: 4,
          status: 'ongoing',
          winner: null,
        },
      ],
    })
    await gotoApp(page)

    await clickCell(page, 0)
    await expect(cell(page, 0)).toHaveText('X')
    await expect(cell(page, 4)).toHaveText('O')
    await expect(page.getByRole('status')).toHaveText('Your turn')
  })

  test('player wins — status and score update', async ({ page }) => {
    await mockBackend(page, {
      moveQueue: [
        {
          board: ['X', '', '', '', 'O', '', '', '', ''],
          ai_move: 4,
          status: 'ongoing',
          winner: null,
        },
        {
          board: ['X', 'X', '', '', 'O', 'O', '', '', ''],
          ai_move: 5,
          status: 'ongoing',
          winner: null,
        },
        {
          board: ['X', 'X', 'X', '', 'O', 'O', '', '', ''],
          ai_move: null,
          status: 'win',
          winner: 'X',
        },
      ],
    })
    await gotoApp(page)

    await clickCell(page, 0)
    await clickCell(page, 1)
    await clickCell(page, 2)

    await expect(page.getByRole('status')).toHaveText('You win!')
    await expect(page.getByText(/Player: 1/)).toBeVisible()
    await expect(page.getByText(/AI: 0/)).toBeVisible()

    // Board is locked after the game ends.
    await expect(cell(page, 3)).toBeDisabled()
  })

  test('AI wins — status and score update', async ({ page }) => {
    await mockBackend(page, {
      moveQueue: [
        {
          board: ['X', '', '', '', 'O', '', '', '', ''],
          ai_move: 4,
          status: 'ongoing',
          winner: null,
        },
        {
          board: ['X', 'X', '', '', 'O', '', '', 'O', ''],
          ai_move: 7,
          status: 'ongoing',
          winner: null,
        },
        {
          board: ['X', 'X', 'X', '', 'O', '', '', 'O', 'O'],
          // AI fills the center column for a vertical win on 1/4/7? Actually use top-bottom diagonal 2/4/6 scenario — but keep it simple:
          ai_move: 8,
          status: 'win',
          winner: 'O',
        },
      ],
    })
    await gotoApp(page)

    await clickCell(page, 0)
    await clickCell(page, 1)
    await clickCell(page, 2)

    await expect(page.getByRole('status')).toHaveText('AI wins!')
    await expect(page.getByText(/AI: 1/)).toBeVisible()
    await expect(page.getByText(/Player: 0/)).toBeVisible()
  })

  test('draw — status and score update', async ({ page }) => {
    await mockBackend(page, {
      moveQueue: [
        {
          board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
          ai_move: null,
          status: 'draw',
          winner: null,
        },
      ],
    })
    await gotoApp(page)

    await clickCell(page, 8)
    await expect(page.getByRole('status')).toHaveText("It's a draw!")
    await expect(page.getByText(/Draws: 1/)).toBeVisible()
  })

  test('new game resets the board and preserves score', async ({ page }) => {
    await mockBackend(page, {
      moveQueue: [
        {
          board: ['X', 'X', 'X', '', 'O', 'O', '', '', ''],
          ai_move: null,
          status: 'win',
          winner: 'X',
        },
      ],
      newGameResponse: {
        board: ['', '', '', '', '', '', '', '', ''],
        ai_move: null,
        status: 'ongoing',
        winner: null,
      },
    })
    await gotoApp(page)

    await clickCell(page, 2)
    await expect(page.getByText(/Player: 1/)).toBeVisible()

    await page.getByRole('button', { name: /new game/i }).click()

    // All cells empty again.
    for (let i = 0; i < 9; i++) {
      await expect(cell(page, i)).toHaveText('')
    }
    await expect(page.getByRole('status')).toHaveText('Your turn')
    // Score preserved.
    await expect(page.getByText(/Player: 1/)).toBeVisible()
  })

  test('loading status shows while AI is thinking', async ({ page }) => {
    // Delay the mocked response so we can observe the "AI is thinking..." text.
    await page.route('**/api/game/move', async route => {
      await new Promise(r => setTimeout(r, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          board: ['X', '', '', '', 'O', '', '', '', ''],
          ai_move: 4,
          status: 'ongoing',
          winner: null,
        }),
      })
    })
    await gotoApp(page)

    await clickCell(page, 0)
    await expect(page.getByRole('status')).toHaveText('AI is thinking...')
    await expect(page.getByRole('status')).toHaveText('Your turn', { timeout: 3000 })
  })
})
