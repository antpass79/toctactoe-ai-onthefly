/** Shared helpers for E2E specs. */
import type { Page, Route } from '@playwright/test'
import { expect } from '@playwright/test'

export type Cell = '' | 'X' | 'O'
export type Status = 'ongoing' | 'win' | 'draw'

export interface BackendMoveResponse {
  board: Cell[]
  ai_move: number | null
  status: Status
  winner: 'X' | 'O' | null
}

export async function gotoApp(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.locator('app-root')).toBeVisible()
  // Board has rendered its 9 cells.
  await expect(page.locator('app-cell button')).toHaveCount(9)
}

export function cell(page: Page, index: number) {
  return page.locator('app-cell button').nth(index)
}

export async function clickCell(page: Page, index: number): Promise<void> {
  await cell(page, index).click()
}

/**
 * Install a deterministic mock for POST /api/game/move and /api/game/new.
 * `moveQueue` is consumed in FIFO order — one response per player move.
 */
export async function mockBackend(
  page: Page,
  opts: {
    moveQueue: BackendMoveResponse[]
    newGameResponse?: BackendMoveResponse
  },
): Promise<void> {
  const queue = [...opts.moveQueue]
  const newGameResp: BackendMoveResponse = opts.newGameResponse ?? {
    board: ['', '', '', '', '', '', '', '', ''],
    ai_move: null,
    status: 'ongoing',
    winner: null,
  }

  await page.route('**/api/game/move', async (route: Route) => {
    const body = queue.shift()
    if (!body) {
      await route.fulfill({ status: 500, body: 'queue exhausted' })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(body),
    })
  })

  await page.route('**/api/game/new', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(newGameResp),
    })
  })
}
