import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'somak-emerald': '#10B981',
        'somak-crimson': '#EF4444',
        'somak-indigo': '#6366F1',
        'somak-cyan': '#06B6D4',
        'somak-violet': '#8B5CF6',
        'somak-amber': '#F59E0B',
        // Backward compatibility
        'sentry-emerald': '#10B981',
        'sentry-crimson': '#EF4444',
        'sentry-indigo': '#6366F1',
        'sentry-cyan': '#06B6D4',
        cream: {
          50: '#FDFCF9',
          100: '#FAF8F5',
          200: '#F5F2EB',
          300: '#EFECE4',
          400: '#E5E0D6',
          500: '#D6CEBE',
          600: '#AFA492',
          700: '#857B69',
        },
        obsidian: {
          DEFAULT: '#030306',
          950: '#030306',
          900: '#06080F',
          850: '#0B0E17',
          800: '#121622',
          700: '#1E2538',
        },
        porcelain: '#FAF8F5',
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'border-primary': 'var(--border-primary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
export default config
