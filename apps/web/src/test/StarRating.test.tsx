import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StarRating } from '../components/common/StarRating';

describe('StarRating Component', () => {
  it('renders 5 star buttons', () => {
    render(<StarRating value={3} />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  it('calls onChange with selected rating when clicked', () => {
    const handleChange = vi.fn();
    render(<StarRating value={2} onChange={handleChange} />);
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[3]); // 4th star (rating 4)
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it('does not trigger onChange when readOnly is true', () => {
    const handleChange = vi.fn();
    render(<StarRating value={3} onChange={handleChange} readOnly={true} />);
    const stars = screen.getAllByRole('button');
    fireEvent.click(stars[4]);
    expect(handleChange).not.toHaveBeenCalled();
  });
});
