// src/pages/__tests__/HomePage.test.tsx
/**
 * HomePage Landing Smoke Test
 * ═══════════════════════════════════════════════════════════════════════════
 * Verifies:
 * 1. Landing sections render for logged-out users (hero, features, FAQ)
 * 2. FAQ accordion expands and collapses on click
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../HomePage';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ token: null }),
}));

jest.mock('../../features/vault/components', () => ({
  CategoryManager: () => <div>Mock Category Manager</div>,
}));

describe('HomePage landing', () => {
  it('renders hero, features, testimonials, and FAQ sections', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading', { name: /welcome to accountsafe/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /everything a modern vault should be/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /trusted by people who care about security/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument();
  });

  it('shows CTA links to login and register', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    // The login/register CTAs appear in both the hero and the final call-to-action band.
    expect(screen.getAllByRole('link', { name: /log in to your vault/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /create free account/i }).length).toBeGreaterThan(0);
  });

  it('expands and collapses FAQ answers on click', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    const firstQuestion = screen.getByRole('button', { name: /what exactly does accountsafe protect/i });
    const answer = screen.getByText(/stores your passwords, recovery keys, and shared secrets/i);

    // First item starts open.
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');

    // Collapse it.
    fireEvent.click(firstQuestion);
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');

    // Open it again.
    fireEvent.click(firstQuestion);
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
    expect(answer).toBeInTheDocument();
  });

  it('switches FAQ items so only one is open at a time', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    const first = screen.getByRole('button', { name: /what exactly does accountsafe protect/i });
    const second = screen.getByRole('button', { name: /is my data visible to the accountsafe team/i });

    fireEvent.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });
});
