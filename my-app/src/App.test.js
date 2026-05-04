import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders the everyday reminder app', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /simple reminders/i })).toBeInTheDocument();
  expect(screen.getByText(/morning blood pressure pill/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /confirm taken/i })).toBeInTheDocument();
});

test('adds a new reminder from the form', () => {
  render(<App />);

  userEvent.type(screen.getByLabelText(/reminder name/i), 'Dentist checkup');
  userEvent.selectOptions(screen.getByLabelText(/category/i), 'Appointment');
  userEvent.type(screen.getByLabelText(/time/i), '2:15 PM');
  userEvent.type(screen.getByLabelText(/notes/i), 'Bring new patient paperwork.');
  userEvent.click(screen.getByRole('button', { name: /add reminder/i }));

  expect(screen.getByText(/dentist checkup/i)).toBeInTheDocument();
  expect(screen.getByText(/2:15 PM/i)).toBeInTheDocument();
});
