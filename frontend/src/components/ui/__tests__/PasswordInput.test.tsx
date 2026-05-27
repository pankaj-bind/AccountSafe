import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordInput } from '../PasswordInput';

describe('PasswordInput', () => {
  it('masks the value by default', () => {
    render(<PasswordInput value="secret" onChange={() => {}} placeholder="pw" />);
    expect(screen.getByPlaceholderText('pw')).toHaveAttribute('type', 'password');
  });

  it('reveals and re-masks the value when the toggle is clicked', () => {
    render(<PasswordInput value="secret" onChange={() => {}} placeholder="pw" />);
    const input = screen.getByPlaceholderText('pw');
    const toggle = screen.getByRole('button', { name: 'Show password' });

    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('uses a non-submitting button so it never triggers form submission', () => {
    const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput value="" onChange={() => {}} placeholder="pw" />
      </form>
    );
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('type', 'button');
    fireEvent.click(toggle);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reserves room for the leading icon only when it is shown', () => {
    const { rerender } = render(
      <PasswordInput value="" onChange={() => {}} placeholder="pw" />
    );
    expect(screen.getByPlaceholderText('pw')).not.toHaveClass('pl-10');

    rerender(<PasswordInput value="" onChange={() => {}} placeholder="pw" showLeftIcon />);
    expect(screen.getByPlaceholderText('pw')).toHaveClass('pl-10');
  });

  it('links the toggle to the input via aria-controls', () => {
    render(<PasswordInput id="my-pw" value="" onChange={() => {}} placeholder="pw" />);
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute(
      'aria-controls',
      'my-pw'
    );
  });
});
