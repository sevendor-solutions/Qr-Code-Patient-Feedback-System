import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmojiScale } from '../components/common/EmojiScale';
import '../i18n';

describe('EmojiScale Component', () => {
  it('renders 5 emoji options', () => {
    render(<EmojiScale value={4} onChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('calls onChange with corresponding score when emoji is clicked', () => {
    const handleChange = vi.fn();
    render(<EmojiScale value={3} onChange={handleChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[4]); // 5th option (Excellent)
    expect(handleChange).toHaveBeenCalledWith(5);
  });
});
