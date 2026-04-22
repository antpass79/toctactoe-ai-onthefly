/**
 * Mirrors Tests/Frontend/React/Cell.test.tsx.
 * Expects: @src/app/components/cell/cell.component exposes CellComponent
 * with inputs { value: string, disabled: boolean } and output (cellClick).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'

import { CellComponent } from '@src/app/components/cell/cell.component'

async function renderCell(opts: { value?: string; disabled?: boolean; onClick?: () => void } = {}) {
  const onClick = opts.onClick ?? vi.fn()
  const result = await render(CellComponent, {
    inputs: { value: opts.value ?? '', disabled: opts.disabled ?? false },
    on: { cellClick: onClick },
  })
  return { ...result, onClick }
}

describe('CellComponent', () => {
  it('renders empty cell', async () => {
    await renderCell()
    const button = screen.getByRole('button', { name: /empty cell/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('')
  })

  it('renders X', async () => {
    await renderCell({ value: 'X' })
    expect(screen.getByRole('button', { name: /cell x/i })).toHaveTextContent('X')
  })

  it('renders O', async () => {
    await renderCell({ value: 'O' })
    expect(screen.getByRole('button', { name: /cell o/i })).toHaveTextContent('O')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const { onClick } = await renderCell()
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled when occupied', async () => {
    await renderCell({ value: 'X' })
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when disabled prop is true', async () => {
    await renderCell({ disabled: true })
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const { onClick } = await renderCell({ disabled: true })
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
