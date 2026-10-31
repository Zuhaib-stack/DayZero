/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        surface: {
          DEFAULT: '#11131a',
          lighter: '#1a1d27',
          border: '#252936',
          hover: '#202431'
        },
        primary: {
          DEFAULT: '#8b5cf6',
          hover: '#7c3aed',
          light: '#a78bfa',
          glow: 'rgba(139, 92, 246, 0.25)'
        },
        cyan: {
          neon: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.25)'
        },
        emerald: {
          neon: '#10b981',
          glow: 'rgba(16, 185, 129, 0.25)'
        },
        rose: {
          neon: '#f43f5e',
          glow: 'rgba(244, 63, 94, 0.25)'
        },
        amber: {
          neon: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.25)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(139, 92, 246, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}

