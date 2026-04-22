import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GameStatus } from '@src/components/GameStatus';

describe('GameStatus', () => {
  it('shows "Your turn" when ongoing', () => {
    render(<GameStatus status="ongoing" winner={null} isLoading={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('Your turn');
  });

  it('shows "AI is thinking..." when loading', () => {
    render(<GameStatus status="ongoing" winner={null} isLoading={true} />);
    expect(screen.getByRole('status')).toHaveTextContent('AI is thinking...');
  });

  it('shows "You win!" when player wins', () => {
    render(<GameStatus status="win" winner="X" isLoading={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('You win!');
  });

  it('shows "AI wins!" when AI wins', () => {
    render(<GameStatus status="win" winner="O" isLoading={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('AI wins!');
  });

  it('shows "It\'s a draw!" when draw', () => {
    render(<GameStatus status="draw" winner={null} isLoading={false} />);
    expect(screen.getByRole('status')).toHaveTextContent("It's a draw!");
  });

  it('shows loading message over win status', () => {
    render(<GameStatus status="win" winner="X" isLoading={true} />);
    expect(screen.getByRole('status')).toHaveTextContent('AI is thinking...');
  });
});
