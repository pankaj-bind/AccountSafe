/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
  plugins: [],
}
