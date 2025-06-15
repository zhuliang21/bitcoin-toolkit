/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 1.5s ease-in-out infinite',
        'fadeInUp': 'fadeInUp 0.5s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'smoothFall': 'smoothFall 8s linear forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'matrix-glow': 'matrix-glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'smoothFall': {
          '0%': {
            transform: 'translateX(-50%) translateY(-100px)',
            opacity: '1'
          },
          '100%': {
            transform: 'translateX(-50%) translateY(100vh)',
            opacity: '0'
          }
        },
        'pulse-glow': {
          '0%, 100%': {
            textShadow: '0 0 8px #00ff41, 0 0 16px #00ff41'
          },
          '50%': {
            textShadow: '0 0 12px #00ff41, 0 0 24px #00ff41, 0 0 32px #00ff41'
          }
        },
        'matrix-glow': {
          '0%': {
            textShadow: '0 0 8px #00ff41, 0 0 16px #00ff41',
            filter: 'brightness(1)'
          },
          '100%': {
            textShadow: '0 0 12px #00ff41, 0 0 24px #00ff41, 0 0 32px #00ff41',
            filter: 'brightness(1.2)'
          }
        }
      },
      colors: {
        'matrix-green': '#00ff41',
        'matrix-dark': '#001100',
      },
      backdropBlur: {
        '20': '20px',
      }
    }
  },
  plugins: [],
} 