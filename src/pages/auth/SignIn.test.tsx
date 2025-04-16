import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SignIn } from './SignIn'; // Use named import
import { useAuthStore } from '../../stores/authStore';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock react-router-dom's useNavigate
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('SignIn Component', () => {
  it('renders the sign in form', () => {
    // Mock the store state for this test
    (useAuthStore as any).mockReturnValue({
      signInWithPassword: vi.fn(),
      loading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    );

    // Check for key elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    // Check for the "Create account" link instead
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
  });

  // Add more tests later for form submission, error handling, etc.
});
