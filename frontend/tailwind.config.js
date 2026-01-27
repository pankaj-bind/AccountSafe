/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    // Custom breakpoints for high-density mobile optimization
    screens: {
      'xs': '375px',  // Small mobile devices
      'sm': '640px',  // Large mobile / small tablet
      'md': '768px',  // Tablet
      'lg': '1024px', // Desktop
      'xl': '1280px', // Large desktop
      '2xl': '1536px', // Extra large
    },
    extend: {
      colors: {
        // Design System - Primary Palette
        primary: {
          DEFAULT: '#4F46E5',
          50: '#ECEFFE',
          100: '#D9DFFD',
          200: '#B3BFFB',
          300: '#8D9FF9',
          400: '#6E7CF7',
          500: '#4F46E5',
          600: '#3730A3',
          700: '#312E81',
          800: '#1E1B4B',
          900: '#0F0E29',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#64748B',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          foreground: '#FFFFFF',
        },
        // Background & Surface
        background: '#F8FAFC',
        foreground: '#0F172A',
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        accent: {
          DEFAULT: '#F1F5F9',
          foreground: '#0F172A',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A',
        },
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#4F46E5',
        // Windows 11 Fluent Design - Using CSS variables for light/dark mode support
        win: {
          // Background layers - auto-switch with CSS variables
          'bg-solid': 'var(--win-bg-solid)',
          'bg-layer': 'var(--win-bg-layer)',
          'bg-subtle': 'var(--win-bg-subtle)',
          'bg-hover': 'var(--win-bg-hover)',
          // Text colors
          'text-primary': 'var(--win-text-primary)',
          'text-secondary': 'var(--win-text-secondary)',
          'text-tertiary': 'var(--win-text-tertiary)',
          // Accent colors
          'accent': 'var(--win-accent)',
          'accent-hover': 'var(--win-accent-hover)',
          'accent-light': 'var(--win-accent-light)',
          // Border colors
          'border-default': 'var(--win-border-default)',
          'border-subtle': 'var(--win-border-subtle)',
        }
      },
      fontFamily: {
        'segoe': ['"Segoe UI Variable"', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        'mono-card': ['Consolas', '"Courier New"', 'monospace'],
      },
      borderRadius: {
        'win': '8px',
        'win-lg': '12px',
        'card': '22px',
      },
      boxShadow: {
        'win-card': '0 2px 4px rgba(0, 0, 0, 0.08), 0 0 2px rgba(0, 0, 0, 0.06)',
        'win-elevated': '0 8px 16px rgba(0, 0, 0, 0.12), 0 0 2px rgba(0, 0, 0, 0.08)',
        'win-flyout': '0 16px 32px rgba(0, 0, 0, 0.18), 0 0 2px rgba(0, 0, 0, 0.08)',
        'card': '0 22px 48px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.25)',
        'card-hover': '0 30px 60px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
        'card-glow-red': '0 50px 100px rgba(0, 0, 0, 0.6), 0 0 80px rgba(220, 38, 38, 0.4)',
      },
      backdropBlur: {
        'win': '30px',
      },
      animation: {
        // Credit Card Animations
        'blob-morph': 'blob-morph 10s ease-in-out infinite',
        'blob-morph-delayed': 'blob-morph 10s ease-in-out 3s infinite',
        'blob-morph-delayed-2': 'blob-morph 10s ease-in-out 6s infinite',
        'wave': 'wave 10s ease-in-out infinite',
        'wave-delayed': 'wave 10s ease-in-out 3s infinite',
        'rotate-ring': 'rotate-ring 15s linear infinite',
        'rotate-ring-reverse': 'rotate-ring 15s linear infinite reverse',
        'light-sweep': 'light-sweep 6s ease-in-out infinite',
        'particle-drift': 'particle-drift 8s ease-in-out infinite',
        'particle-drift-delayed': 'particle-drift 8s ease-in-out 2s infinite',
        'particle-drift-delayed-2': 'particle-drift 8s ease-in-out 4s infinite',
        'shimmer-slide': 'shimmer-slide 4s ease-in-out infinite',
        'blob-rotate': 'blob-rotate 20s linear infinite',
        'blob-rotate-reverse': 'blob-rotate 25s linear infinite reverse',
        'blob-move': 'blob-move 15s linear infinite',
      },
      keyframes: {
        'blob-morph': {
          '0%, 100%': { 
            borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%', 
            transform: 'translate(0, 0) rotate(0deg) scale(1)' 
          },
          '20%': { 
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', 
            transform: 'translate(20px, -20px) rotate(72deg) scale(1.15)' 
          },
          '40%': { 
            borderRadius: '50% 50% 50% 50% / 50% 50% 50% 50%', 
            transform: 'translate(-15px, 15px) rotate(144deg) scale(0.9)' 
          },
          '60%': { 
            borderRadius: '30% 70% 60% 40% / 50% 60% 40% 50%', 
            transform: 'translate(-20px, -15px) rotate(216deg) scale(1.1)' 
          },
          '80%': { 
            borderRadius: '70% 30% 40% 60% / 40% 60% 50% 50%', 
            transform: 'translate(10px, 10px) rotate(288deg) scale(0.95)' 
          },
        },
        'wave': {
          '0%, 100%': { transform: 'translateX(-25%) translateY(0)' },
          '50%': { transform: 'translateX(-50%) translateY(-30px)' },
        },
        'rotate-ring': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'light-sweep': {
          '0%': { transform: 'translateX(-50%) translateY(-50%) rotate(25deg)' },
          '100%': { transform: 'translateX(50%) translateY(50%) rotate(25deg)' },
        },
        'particle-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(0)', opacity: '0' },
          '50%': { transform: 'translate(40px, -40px) scale(1.5)', opacity: '1' },
        },
        'shimmer-slide': {
          '0%': { transform: 'translateX(-100%) translateY(-100%)' },
          '100%': { transform: 'translateX(100%) translateY(100%)' },
        },
        'blob-rotate': {
          '0%': { transform: 'rotate(0deg) scale(1)', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' },
          '50%': { transform: 'rotate(180deg) scale(1.1)', borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%' },
          '100%': { transform: 'rotate(360deg) scale(1)', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' },
        },
        'blob-move': {
          '0%': { transform: 'translate(-50%, -50%) translate(-30px, -20px)' },
          '50%': { transform: 'translate(-50%, -50%) translate(30px, 20px)' },
          '100%': { transform: 'translate(-50%, -50%) translate(-30px, -20px)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
