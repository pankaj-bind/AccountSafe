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
      },
      borderRadius: {
        'win': '8px',
        'win-lg': '12px',
      },
      boxShadow: {
        'win-card': '0 2px 4px rgba(0, 0, 0, 0.08), 0 0 2px rgba(0, 0, 0, 0.06)',
        'win-elevated': '0 8px 16px rgba(0, 0, 0, 0.12), 0 0 2px rgba(0, 0, 0, 0.08)',
        'win-flyout': '0 16px 32px rgba(0, 0, 0, 0.18), 0 0 2px rgba(0, 0, 0, 0.08)',
      },
      backdropBlur: {
        'win': '30px',
      },
    },
  },
  plugins: [],
}
