import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Home from './page';

describe('Home', () => {
  it('renders the hero heading', () => {
    // Arrange
    render(<Home />);

    // Act
    const heading = screen.getByRole('heading', { level: 1 });

    // Assert
    expect(heading).toHaveTextContent('Settle any dilemma');
  });
});
