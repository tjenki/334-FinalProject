import { render, screen } from '@testing-library/react';
import Homepage from './Homepage';

test('renders the everyday tracker dashboard', () => {
  render(<Homepage />);
  expect(screen.getByText(/Everyday Tracker/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Today's medicine/i })).toBeInTheDocument();
});
