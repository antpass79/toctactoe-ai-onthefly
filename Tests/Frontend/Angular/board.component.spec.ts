/**
 * Mirrors Tests/Frontend/React/Board.test.tsx.
 * Expects: @src/app/components/board/board.component exposes BoardComponent
 * with inputs { board: string[], disabled: boolean } and output
 * (cellClick) emitting the clicked cell index.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'

import { BoardComponent } from '@src/app/components/board/board.component'

const emptyBoard = Array(9).fill('')

async function renderBoard(opts: {
  board?: string[]
  disabled?: boolean
  onCellClick?: (i: number) => void
} = {}) {
  const onCellClick = opts.onCellClick ?? vi.fn()
  const result = await render(BoardComponent, {
    inputs: {
      board: opts.board ?? emptyBoard,
      disabled: opts.disabled ?? false,
    },
    on: { cellClick: onCellClick },
  })
  return { ...result, onCellClick }
}

describe('BoardComponent', () => {
  it('renders 9 cells', async () => {
    await renderBoard()
    expect(screen.getAllByRole('button')).toHaveLength(9)
  })

  it('renders board with X and O', async () => {
    await renderBoard({ board: ['X', 'O', '', '', '', '', '', '', ''] })
    expect(screen.getByRole('button', { name: /cell x/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cell o/i })).toBeInTheDocument()
  })

  it('calls onCellClick with correct index when cell is clicked', async () => {
    const user = userEvent.setup()
    const { onCellClick } = await renderBoard()
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[4])
    expect(onCellClick).toHaveBeenCalledWith(4)
  })

  it('disables all cells when disabled is true', async () => {
    await renderBoard({ disabled: true })
    screen.getAllByRole('button').forEach(b => expect(b).toBeDisabled())
  })

  it('disables occupied cells even when board is not disabled', async () => {
    await renderBoard({ board: ['X', '', '', '', 'O', '', '', '', ''] })
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toBeDisabled()
    expect(buttons[4]).toBeDisabled()
    expect(buttons[1]).not.toBeDisabled()
  })

  it('renders 3 rows', async () => {
    await renderBoard()
    expect(screen.getAllByRole('row')).toHaveLength(3)
  })
})
