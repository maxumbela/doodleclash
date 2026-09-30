/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arcade: {
          dark: '#0a0b14',
          card: '#121424',
          accent: '#8b5cf6',
          cyan: '#06b6d4',
          pink: '#ec4899',
          yellow: '#facc15',
          green: '#10b981',
          danger: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 1.5s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 25px rgba(236, 72, 153, 0.8), 0 0 35px rgba(6, 182, 212, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
