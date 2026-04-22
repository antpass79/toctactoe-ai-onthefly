import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NewGameButton } from '@src/components/NewGameButton';

describe('NewGameButton', () => {
  it('renders the button', () => {
    render(<NewGameButton onClick={() => {}} />);
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument();
  });

  it('calls onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<NewGameButton onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: /new game/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
