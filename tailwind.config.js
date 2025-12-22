/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'trimais-blue': '#003366',
        'trimais-gold': '#d4af37',
      },
      animation: {
        'ping': 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'swing': 'swing 1s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        swing: { '0%, 100%': { transform: 'rotate(0deg)' }, '20%': { transform: 'rotate(15deg)' }, '40%': { transform: 'rotate(-10deg)' }, '60%': { transform: 'rotate(5deg)' }, '80%': { transform: 'rotate(-5deg)' } }
      }
    },
  },
  plugins: [],
}