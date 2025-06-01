/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8D8741', // оливковый
          hover: '#7a7439',
        },
        secondary: {
          DEFAULT: '#659DBD', // голубой
          hover: '#5889a6',
        },
        accent: {
          DEFAULT: '#DAAD86', // песочный
          hover: '#c59c78',
        },
        brown: {
          DEFAULT: '#BC986A', // светло-коричневый
          hover: '#a78a5f',
        },
        cream: {
          DEFAULT: '#FBEEC1', // кремовый
          hover: '#f5e7ad',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
} 