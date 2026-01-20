import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearEncryptionKeys } from '../services/encryptionService';
import { logoutEvent } from '../utils/logoutEvent';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const navigate = useNavigate();

  const logout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
    clearEncryptionKeys();
    navigate('/login');
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [token]);

  // Listen for logout events from other parts of the app
  useEffect(() => {
    const unsubscribe = logoutEvent.subscribe(() => {
      setToken(null);
      clearEncryptionKeys();
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
