import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Sun, Moon, ChevronDown, BookOpen, LayoutDashboard, User, LogOut, Shield, Trash2, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useProfile } from '../contexts/ProfileContext';
import { usePanic } from '../contexts/PanicContext';
import { useCrypto } from '../services/CryptoContext';
import { ButtonLink, IconButton } from './ui';

// Vault Icon (custom, not in Lucide)
const VaultIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const Navbar: React.FC = () => {
  const { token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { profilePicture, displayName } = useProfile();
  const { isPanicLocked, triggerPanic } = usePanic();
  const { lock } = useCrypto();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
    navigate('/login');
  };

  const handlePanic = () => {
    // Trigger panic mode with vault lock (zero-knowledge: wipes master key from memory)
    triggerPanic(() => lock('panic'));
  };

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  };

  const isActiveRoute = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownRef]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Hide navbar when panic mode is active - AFTER all hooks
  if (isPanicLocked) {
    return null;
  }

  return (
    <>
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" onClick={closeMenus} className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 transition-shadow overflow-hidden p-2">
                <img src="/logo.png" alt="AccountSafe" className="w-6 h-6 object-contain" />
              </div>
              {/* Security indicator dot */}
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0a0a0b]"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">{process.env.REACT_APP_PROJECT_NAME || 'AccountSafe'}</span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-500 tracking-wider uppercase">Secure Vault</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {/* Nav Links */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900/50 rounded-lg p-1 mr-4 space-x-1">
              {token && (
                <>
                  <Link 
                    to="/" 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isActiveRoute('/') 
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <VaultIcon />
                    Vault
                  </Link>
                  <Link 
                    to="/dashboard" 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      isActiveRoute('/dashboard') 
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/security" 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isActiveRoute('/security') 
                        ? 'bg-white dark:bg-zinc-800 text-red-400 shadow-sm' 
                        : 'text-red-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-white/50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    Security
                  </Link>
                </>
              )}
            </div>
            
            {/* Documentation Link - Trust Signal */}
            <Link
              to="/docs"
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-2 mr-2"
            >
              <BookOpen className="w-4 h-4" />
              Documentation
            </Link>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Panic/Lock Button */}
              {token && (
                <button 
                  onClick={handlePanic}
                  className="p-2.5 rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all"
                  title="Emergency Lock - Clear all data and reload"
                >
                  <Lock className="w-5 h-5" />
                </button>
              )}
              
              {/* Theme Toggle */}
              <IconButton 
                onClick={toggleTheme} 
                variant="ghost"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </IconButton>

              {token ? (
                /* User Menu */
                <div className="relative" ref={userDropdownRef}>
                  <button 
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} 
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800/50 hover:bg-zinc-300 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700/50 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all"
                  >
                    <img 
                      className="h-7 w-7 rounded-full ring-2 ring-zinc-300 dark:ring-zinc-700" 
                      src={profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128&background=3b82f6&color=fff`} 
                      alt="User profile" 
                    />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-300 max-w-[100px] truncate">{displayName || 'User'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-900/20 dark:shadow-black/50 overflow-hidden animate-fadeIn">
                      {/* User Info Header */}
                      <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                          <img 
                            className="h-10 w-10 rounded-full ring-2 ring-blue-500/50" 
                            src={profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128&background=3b82f6&color=fff`} 
                            alt="" 
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{displayName || 'User'}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">Manage your account</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-2">
                        {/* Vault & Dashboard - Hidden on Desktop (already in top bar) */}
                        <Link 
                          to="/" 
                          onClick={() => setIsUserDropdownOpen(false)} 
                          className="md:hidden flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <VaultIcon />
                          Secure Vault
                        </Link>
                        <Link 
                          to="/dashboard" 
                          onClick={() => setIsUserDropdownOpen(false)} 
                          className="md:hidden flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        
                        {/* Profile & Security - Always Visible */}
                        <Link 
                          to="/profile" 
                          onClick={() => setIsUserDropdownOpen(false)} 
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile Settings
                        </Link>
                        <Link 
                          to="/vault/trash" 
                          onClick={() => setIsUserDropdownOpen(false)} 
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Trash
                        </Link>
                        <Link 
                          to="/security" 
                          onClick={() => setIsUserDropdownOpen(false)} 
                          className="md:hidden flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Security Settings
                        </Link>
                        
                        <div className="my-2 border-t border-zinc-200 dark:border-zinc-800"></div>
                        
                        <button 
                          onClick={handleLogout} 
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Auth Buttons */
                <div className="flex items-center gap-2">
                  <ButtonLink 
                    to="/login" 
                    variant="ghost"
                    size="default"
                    className="text-zinc-700 dark:text-zinc-300"
                  >
                    Log in
                  </ButtonLink>
                  <ButtonLink 
                    to="/register" 
                    variant="default"
                    className="shadow-lg shadow-primary/25 hover:shadow-primary/40"
                  >
                    Get Started
                  </ButtonLink>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Panic/Lock Button for Mobile */}
            {token && (
              <button 
                onClick={handlePanic}
                className="p-2 rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all"
                title="Emergency Lock"
              >
                <Lock className="w-5 h-5" />
              </button>
            )}
            <IconButton 
              onClick={toggleTheme} 
              variant="ghost"
              size="sm"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </IconButton>
            <IconButton 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              variant="ghost"
              size="sm"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </IconButton>
          </div>
        </div>
      </div>
    </nav>

      {/* Mobile Menu Dropdown - Top Right Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/10 dark:bg-black/20 z-[60]"
            onClick={closeMenus}
          ></div>
          
          {/* Dropdown Menu */}
          <div className="md:hidden fixed top-16 right-4 z-[70] w-64 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-black/20 dark:shadow-black/60 overflow-hidden animate-fadeIn">
            {token ? (
              <>
                {/* User Info Header */}
                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        className="h-10 w-10 rounded-full ring-2 ring-blue-500/50" 
                        src={profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128&background=3b82f6&color=fff`} 
                        alt="" 
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{displayName || 'User'}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage your account</p>
                    </div>
                  </div>
                </div>
                
                {/* Menu Items */}
                <div className="py-2">
                  <Link 
                    to="/" 
                    onClick={closeMenus} 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <VaultIcon />
                    Secure Vault
                  </Link>
                  <Link 
                    to="/dashboard" 
                    onClick={closeMenus} 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Link>
                  <Link 
                    to="/profile" 
                    onClick={closeMenus} 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    Profile Settings
                  </Link>
                  <Link 
                    to="/security" 
                    onClick={closeMenus} 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </Link>
                  <Link 
                    to="/vault/trash" 
                    onClick={closeMenus} 
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Trash
                  </Link>
                  
                  {/* Documentation Link for Authenticated Mobile Users */}
                  <Link
                    to="/docs"
                    onClick={closeMenus}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <BookOpen className="w-5 h-5" />
                    Documentation
                  </Link>
                  
                  <div className="my-2 border-t border-zinc-200 dark:border-zinc-800"></div>
                  
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="p-3 space-y-2">
                {/* Documentation Link for Mobile */}
                <Link
                  to="/docs"
                  onClick={closeMenus}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-zinc-700"
                >
                  <BookOpen className="w-4 h-4" />
                  Documentation
                </Link>
                <ButtonLink 
                  to="/login" 
                  onClick={closeMenus}
                  variant="secondary"
                  className="w-full justify-center"
                >
                  Log in
                </ButtonLink>
                <ButtonLink 
                  to="/register" 
                  onClick={closeMenus}
                  variant="default"
                  className="w-full justify-center shadow-lg shadow-primary/25"
                >
                  Get Started
                </ButtonLink>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
