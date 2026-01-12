import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CategoryManager from '../components/CategoryManager';

const HomePage: React.FC = () => {
  const { token } = useAuth();

  return (
    <div className="min-h-screen win-bg-solid">
      {token ? (
        <CategoryManager />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-3xl font-bold win-text-primary mb-8">Welcome to AccountSafe</h1>
            <div className="flex gap-4 justify-center">
              <Link to="/login" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors shadow-win-card">
                Log in
              </Link>
              <Link to="/register" className="px-6 py-3 win-bg-layer border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-win-card">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

