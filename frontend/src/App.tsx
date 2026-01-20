// src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Context Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { PanicProvider } from './contexts/PanicContext';
import { PrivacyGuardProvider } from './contexts/PrivacyGuardContext';

// Import Layout Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import ProfileUpdater from './components/ProfileUpdater';
import PanicListener from './components/PanicListener';
import PrivacyGuard from './components/PrivacyGuard';
import SessionMonitor from './components/SessionMonitor';

// Import Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';
import OrganizationPage from './pages/OrganizationPage';
import SharedSecretPage from './pages/SharedSecretPage';
import './App.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <PanicProvider>
            <ProfileProvider>
              <PrivacyGuardProvider>
                <PrivacyGuard>
                  <ProfileUpdater />
                  <PanicListener />
                  <SessionMonitor />
                  <div className="bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 min-h-screen transition-colors duration-200 font-sans">
                    <Navbar />
                    <main>
                      <Routes>
                        {/* Public/Mixed Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        
                        {/* Shared Secret Route - Public */}
                        <Route path="/shared/:secretId" element={<SharedSecretPage />} />
                        
                        {/* Protected Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                        <Route path="/security" element={<ProtectedRoute><SecuritySettingsPage /></ProtectedRoute>} />
                        <Route path="/organization/:id" element={<ProtectedRoute><OrganizationPage /></ProtectedRoute>} />
                      </Routes>
                    </main>
                  </div>
                </PrivacyGuard>
              </PrivacyGuardProvider>
            </ProfileProvider>
          </PanicProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
