import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-win-bg-solid flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-win-text-primary mb-6">
          Welcome to AccountSafe
        </h1>
        <p className="text-xl text-win-text-secondary mb-12">
          A complete authentication system with Django and React
        </p>
        
        <div className="flex gap-4 justify-center">
          {!token ? (
            <>
              <Link to="/login" className="win-btn-primary px-8 py-3 text-lg">
                Sign In
              </Link>
              <Link to="/register" className="win-btn-secondary px-8 py-3 text-lg">
                Create Account
              </Link>
            </>
          ) : (
            <p className="text-lg text-win-text-primary">
              You're logged in! 🎉
            </p>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="win-card p-6">
            <h3 className="text-lg font-semibold text-win-text-primary mb-2">🔐 Secure Authentication</h3>
            <p className="text-sm text-win-text-secondary">Token-based auth with Django Rest Framework</p>
          </div>
          <div className="win-card p-6">
            <h3 className="text-lg font-semibold text-win-text-primary mb-2">📧 Password Reset</h3>
            <p className="text-sm text-win-text-secondary">OTP-based email verification for password recovery</p>
          </div>
          <div className="win-card p-6">
            <h3 className="text-lg font-semibold text-win-text-primary mb-2">⚡ Modern UI</h3>
            <p className="text-sm text-win-text-secondary">Clean design with Tailwind CSS</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
