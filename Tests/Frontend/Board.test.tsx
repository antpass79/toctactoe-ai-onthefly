import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Board } from '@src/components/Board';

describe('Board', () => {
  const emptyBoard = Array(9).fill('');

  it('renders 9 cells', () => {
    render(<Board board={emptyBoard} onCellClick={() => {}} disabled={false} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(9);
  });

  it('renders board with X and O', () => {
    const board = ['X', 'O', '', '', '', '', '', '', ''];
    render(<Board board={board} onCellClick={() => {}} disabled={false} />);
    expect(screen.getByRole('button', { name: /cell x/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cell o/i })).toBeInTheDocument();
  });

  it('calls onCellClick with correct index when cell is clicked', async () => {
    const user = userEvent.setup();
    const onCellClick = vi.fn();
    render(<Board board={emptyBoard} onCellClick={onCellClick} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[4]); // center cell
    expect(onCellClick).toHaveBeenCalledWith(4);
  });

  it('disables all cells when disabled is true', () => {
    render(<Board board={emptyBoard} onCellClick={() => {}} disabled={true} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('disables occupied cells even when board is not disabled', () => {
    const board = ['X', '', '', '', 'O', '', '', '', ''];
    render(<Board board={board} onCellClick={() => {}} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled(); // X occupied
    expect(buttons[4]).toBeDisabled(); // O occupied
    expect(buttons[1]).not.toBeDisabled(); // empty
  });

  it('renders 3 rows', () => {
    render(<Board board={emptyBoard} onCellClick={() => {}} disabled={false} />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
  });
});
