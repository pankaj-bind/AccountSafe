import React from 'react';
import CategoryManager from '../components/CategoryManager';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b]">
      <CategoryManager />
    </div>
  );
};

export default HomePage;
