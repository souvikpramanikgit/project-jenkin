import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Create a New Task heading', () => {
  render(<App />);
  const heading = screen.getByText(/Create a New Task/i);
  expect(heading).toBeInTheDocument();
});
