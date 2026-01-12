import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useProfile } from '../contexts/ProfileContext';

// SVG Icons for the theme toggle button (Windows 11 style)
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const Navbar: React.FC = () => {
  const { token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { profilePicture, displayName } = useProfile();
  const navigate = useNavigate();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
    navigate('/login');
  };

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownRef]);

  return (
    <nav className="win-navbar">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" onClick={closeMenus} className="flex items-center flex-shrink-0 group">
            <img
              src={process.env.REACT_APP_LOGO_URL || '/account-safe-logo.png'}
              alt="logo"
              className="h-10 w-10"
            />
            <span className="ml-2 text-lg font-semibold text-win-text-primary">{process.env.REACT_APP_PROJECT_NAME || 'AccountSafe'}</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <div className="flex items-center">
              <Link to="/" className="px-3 py-1.5 rounded-win text-sm font-medium text-win-text-secondary hover:bg-win-bg-hover transition-colors duration-150">Home</Link>
              {token && <Link to="/dashboard" className="px-3 py-1.5 rounded-win text-sm font-medium text-win-text-secondary hover:bg-win-bg-hover transition-colors duration-150">Dashboard</Link>}
            </div>
            
            <div className="flex items-center ml-4 space-x-1">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-win text-win-text-tertiary hover:bg-win-bg-hover transition-colors duration-150"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>
              
              {token ? (
                <div className="relative ml-2" ref={userDropdownRef}>
                  <button 
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} 
                    className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-win-accent focus:ring-offset-2"
                  >
                    <img 
                      className="h-8 w-8 rounded-full border-2 border-transparent hover:border-win-accent transition-colors duration-150" 
                      src={profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128&background=60cdff&color=fff`} 
                      alt="User profile" 
                    />
                  </button>
                  {isUserDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-3 w-56 rounded-xl shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fadeIn">
                      <div className="px-5 py-4 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Your Account</p>
                      </div>
                      <div className="py-2">
                        <Link 
                          to="/dashboard" 
                          onClick={() => setIsUserDropdownOpen(false)} 
                          className="flex items-center px-5 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-150"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          Dashboard
                        </Link>
                        <Link 
                          to="/profile" 
                          onClick={() => setIsUserDropdownOpen(false)} 
                          className="flex items-center px-5 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-150"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        <button 
                          onClick={handleLogout} 
                          className="flex items-center w-full px-5 py-3 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-150"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 ml-2">
                  <Link to="/login" className="px-3 py-1.5 rounded-win text-sm font-medium text-win-text-secondary hover:bg-win-bg-hover transition-colors duration-150">Log in</Link>
                  <Link to="/register" className="win-btn-primary px-4 py-1.5 rounded-win text-sm font-medium">Sign up</Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Menu Button & Theme Toggle */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleTheme} className="p-2 rounded-win text-win-text-tertiary hover:bg-win-bg-hover mr-1 transition-colors duration-150">
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-win text-win-text-secondary hover:bg-win-bg-hover transition-colors duration-150">
              {isMobileMenuOpen ? ( <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> ) : ( <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg> )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-win-border-default bg-win-bg-layer backdrop-blur-win">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-win-text-secondary hover:bg-win-bg-hover block px-3 py-2 rounded-win text-sm font-medium transition-colors duration-150">Home</Link>
            {token && <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-win-text-secondary hover:bg-win-bg-hover block px-3 py-2 rounded-win text-sm font-medium transition-colors duration-150">Dashboard</Link>}
          </div>
          <div className="pt-4 pb-3 border-t border-win-border-default">
            {token ? (
              <>
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <img className="h-10 w-10 rounded-full" src={profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128&background=60cdff&color=fff`} alt="" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-win-text-primary">Your Account</div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-win text-sm font-medium text-win-text-secondary hover:bg-win-bg-hover transition-colors duration-150">Dashboard</Link>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-win text-sm font-medium text-win-text-secondary hover:bg-win-bg-hover transition-colors duration-150">Profile</Link>
                  <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-win text-sm font-medium text-red-500 hover:bg-win-bg-hover transition-colors duration-150">Sign out</button>
                </div>
              </>
            ) : (
              <div className="px-5 space-y-3">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center win-btn-primary py-2 rounded-win text-sm font-medium">Log in</Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center text-win-accent border border-win-accent px-4 py-2 rounded-win text-sm font-medium hover:bg-win-bg-hover transition-colors duration-150">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
