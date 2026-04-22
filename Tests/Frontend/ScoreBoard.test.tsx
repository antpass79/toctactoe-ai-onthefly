import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScoreBoard } from '@src/components/ScoreBoard';

describe('ScoreBoard', () => {
  it('renders initial scores as 0', () => {
    render(<ScoreBoard score={{ player: 0, ai: 0, draws: 0 }} />);
    expect(screen.getByText(/Player: 0/)).toBeInTheDocument();
    expect(screen.getByText(/AI: 0/)).toBeInTheDocument();
    expect(screen.getByText(/Draws: 0/)).toBeInTheDocument();
  });

  it('renders updated scores', () => {
    render(<ScoreBoard score={{ player: 3, ai: 1, draws: 2 }} />);
    expect(screen.getByText(/Player: 3/)).toBeInTheDocument();
    expect(screen.getByText(/AI: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Draws: 2/)).toBeInTheDocument();
  });
});
