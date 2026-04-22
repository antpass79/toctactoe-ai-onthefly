import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Cell } from '@src/components/Cell';

describe('Cell', () => {
  it('renders empty cell', () => {
    render(<Cell value="" onClick={() => {}} disabled={false} />);
    const button = screen.getByRole('button', { name: /empty cell/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('');
  });

  it('renders X', () => {
    render(<Cell value="X" onClick={() => {}} disabled={false} />);
    const button = screen.getByRole('button', { name: /cell x/i });
    expect(button).toHaveTextContent('X');
  });

  it('renders O', () => {
    render(<Cell value="O" onClick={() => {}} disabled={false} />);
    const button = screen.getByRole('button', { name: /cell o/i });
    expect(button).toHaveTextContent('O');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Cell value="" onClick={onClick} disabled={false} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when occupied', () => {
    render(<Cell value="X" onClick={() => {}} disabled={false} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Cell value="" onClick={() => {}} disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Cell value="" onClick={onClick} disabled={true} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
