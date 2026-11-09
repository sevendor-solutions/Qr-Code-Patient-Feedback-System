import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NpsScale } from '../components/common/NpsScale';

describe('NpsScale Component', () => {
  it('renders 11 buttons from 0 to 10', () => {
    render(<NpsScale value={8} onChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(11);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('calls onChange with clicked score', () => {
    const handleChange = vi.fn();
    render(<NpsScale value={5} onChange={handleChange} />);
    const button9 = screen.getByText('9');
    fireEvent.click(button9);
    expect(handleChange).toHaveBeenCalledWith(9);
  });
});
