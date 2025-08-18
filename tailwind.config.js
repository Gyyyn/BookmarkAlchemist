/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./bookmarks.html", // Scan this file for classes
  ],
  darkMode: 'class', // Enable dark mode
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#101010'
        }
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.95)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        'fly-out': {
            '0%': { transform: 'scale(1)', opacity: 1 },
            '100%': { transform: 'scale(0.25) translate(-100%, -100%)', opacity: 0 }
        },
        wiggle: { '0%,100%': { transform: 'rotate(-1deg)' }, '50%': { transform: 'rotate(1deg)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-2px)' } },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        pop: 'pop .18s ease-out both',
        'fly-out': 'fly-out 0.4s ease-in forwards',
        wiggle: 'wiggle .35s ease-in-out',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 1.25s linear infinite'
      },
      boxShadow: {
        soft: '0 6px 20px rgba(0,0,0,.08)'
      }
    }
  },
  plugins: [],
}
