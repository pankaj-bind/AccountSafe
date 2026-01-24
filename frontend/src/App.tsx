// src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Context Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { PanicProvider } from './contexts/PanicContext';
import { PrivacyGuardProvider } from './contexts/PrivacyGuardContext';
import { CryptoProvider } from './services/CryptoContext';

// Import Layout Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import ProfileUpdater from './components/ProfileUpdater';
import PanicListener from './components/PanicListener';
import GlobalPanicHandler from './components/GlobalPanicHandler';
import PrivacyGuard from './components/PrivacyGuard';
import SessionMonitor from './components/SessionMonitor';
import VaultGuard from './components/VaultGuard';

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
import TrashPage from './pages/TrashPage';
import './App.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <CryptoProvider>
            <PanicProvider>
              <ProfileProvider>
                <PrivacyGuardProvider>
                  <PrivacyGuard>
                    <ProfileUpdater />
                    <PanicListener />
                    <GlobalPanicHandler />
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
                          
                          {/* Protected Routes - VaultGuard ensures vault is unlocked */}
                          <Route path="/dashboard" element={<ProtectedRoute><VaultGuard><DashboardPage /></VaultGuard></ProtectedRoute>} />
                          <Route path="/profile" element={<ProtectedRoute><VaultGuard><ProfilePage /></VaultGuard></ProtectedRoute>} />
                          <Route path="/security" element={<ProtectedRoute><VaultGuard><SecuritySettingsPage /></VaultGuard></ProtectedRoute>} />
                          <Route path="/organization/:id" element={<ProtectedRoute><VaultGuard><OrganizationPage /></VaultGuard></ProtectedRoute>} />
                          <Route path="/vault/trash" element={<ProtectedRoute><VaultGuard><TrashPage /></VaultGuard></ProtectedRoute>} />
                        </Routes>
                      </main>
                    </div>
                  </PrivacyGuard>
                </PrivacyGuardProvider>
              </ProfileProvider>
            </PanicProvider>
          </CryptoProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
