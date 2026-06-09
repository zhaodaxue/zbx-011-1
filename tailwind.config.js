/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        forest: {
          50: '#f0f7f4',
          100: '#d9e8e0',
          200: '#b3d1c1',
          300: '#85b59d',
          400: '#52796F',
          500: '#355f55',
          600: '#284a42',
          700: '#1B4332',
          800: '#143629',
          900: '#0d2a1f',
        },
        amber: {
          DEFAULT: '#E07B39',
          50: '#fdf4ec',
          100: '#fbe8d4',
          200: '#f6cfa8',
          300: '#f0b071',
          400: '#E07B39',
          500: '#cc6222',
          600: '#b04a18',
          700: '#8c3a16',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
