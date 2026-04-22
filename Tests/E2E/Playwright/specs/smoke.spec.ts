/**
 * Smoke test against the REAL backend + frontend.
 * Verifies CORS, wiring, and that a human move actually triggers an AI move.
 * The AI's exact choice is random, so assertions only check invariants.
 */
import { test, expect } from '@playwright/test'
import { gotoApp, cell, clickCell } from './helpers'

test.describe('live stack smoke', () => {
  test('initial page renders board and status', async ({ page }) => {
    await gotoApp(page)
    await expect(page.getByRole('heading', { name: /tic tac toe vs ai/i })).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('Your turn')
    await expect(page.locator('app-cell button')).toHaveCount(9)

    // Initial score is all zeros.
    await expect(page.getByText(/Player: 0/)).toBeVisible()
    await expect(page.getByText(/AI: 0/)).toBeVisible()
    await expect(page.getByText(/Draws: 0/)).toBeVisible()
  })

  test('player move reaches backend and AI responds (no CORS error)', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await gotoApp(page)

    // Wait for the real network roundtrip.
    const moveResponse = page.waitForResponse(
      r => r.url().includes('/api/game/move') && r.request().method() === 'POST',
    )
    await clickCell(page, 0)
    const resp = await moveResponse
    expect(resp.status()).toBe(200)

    // Player X is placed.
    await expect(cell(page, 0)).toHaveText('X')

    // AI eventually places an O somewhere (exact position is random).
    await expect(page.locator('app-cell button', { hasText: 'O' })).toHaveCount(1, { timeout: 5000 })

    // No CORS / network errors appeared in the console.
    const cors = consoleErrors.filter(e => /cors/i.test(e) || /access-control/i.test(e))
    expect(cors, `CORS-related console errors: ${cors.join('\n')}`).toHaveLength(0)
  })
})
