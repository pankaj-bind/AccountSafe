import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../HomePage';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: null,
  }),
}));

jest.mock('../../features/vault/components', () => ({
  CategoryManager: () => <div>Vault dashboard</div>,
}));

describe('HomePage public FAQ', () => {
  it('renders a compact security FAQ without fabricated social proof', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading', { name: /straight answers from the security docs/i })).toBeInTheDocument();
    expect(screen.getByText(/what does zero-knowledge mean in accountsafe/i)).toBeInTheDocument();
    expect(screen.getByText(/does my master password leave my device/i)).toBeInTheDocument();
    expect(screen.getByText(/can i self-host accountsafe/i)).toBeInTheDocument();
    expect(screen.queryByText(/testimonial/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/trusted by/i)).not.toBeInTheDocument();
  });
});
