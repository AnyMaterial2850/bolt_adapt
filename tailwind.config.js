const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.blue,
        success: colors.green,
        warning: colors.yellow,
        error: colors.red,
        
        // Brand Category Colors
        eat: {
          50: '#F9FBE7',
          100: '#F0F4C3',
          200: '#E6EE9C',
          300: '#DCE775',
          400: '#D4E157',
          500: '#C3D900', // Specific yellow hex as requested
          600: '#AFB42B',
          700: '#9E9D24',
          800: '#827717',
          900: '#694F00',
        },
        move: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800', // Primary Brand Color
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
        },
        mind: {
          50: '#F3E5F5',
          100: '#E1BEE7',
          200: '#CE93D8',
          300: '#BA68C8',
          400: '#AB47BC',
          500: '#9C27B0', // Primary Brand Color
          600: '#8E24AA',
          700: '#7B1FA2',
          800: '#6A1B9A',
          900: '#4A148C',
        },
        sleep: {
          50: '#E8EAF6',
          100: '#C5CAE9',
          200: '#9FA8DA',
          300: '#7986CB',
          400: '#5C6BC0',
          500: '#3F51B5', // Primary Brand Color
          600: '#3949AB',
          700: '#303F9F',
          800: '#283593',
          900: '#1A237E',
        }
      },
      animation: {
        'celebrate': 'bounce 1s ease-in-out 2',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        }
      }
    },
  },
  plugins: [],
}
