const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'spark-1': {
          '0%': { transform: 'translateY(0) scale(0)', opacity: 0 },
          '20%': { transform: 'translate(3px, -3px) rotate(30deg) scale(1)', opacity: 0.7 },
          '40%': { transform: 'translate(5px, -5px) rotate(60deg) scale(1.2)', opacity: 1 },
          '60%': { transform: 'translate(2px, -8px) rotate(90deg) scale(1)', opacity: 0.9 },
          '100%': { transform: 'translateY(-20px) rotate(180deg) scale(0)', opacity: 0 }
        },
        'spark-2': {
          '0%': { transform: 'translateY(0) scale(0)', opacity: 0 },
          '20%': { transform: 'translate(-3px, -3px) rotate(-30deg) scale(1)', opacity: 0.7 },
          '40%': { transform: 'translate(-5px, -5px) rotate(-60deg) scale(1.2)', opacity: 1 },
          '60%': { transform: 'translate(-2px, -8px) rotate(-90deg) scale(1)', opacity: 0.9 },
          '100%': { transform: 'translateY(-20px) rotate(-180deg) scale(0)', opacity: 0 }
        },
        'spark-3': {
          '0%': { transform: 'translateX(0) scale(0)', opacity: 0 },
          '20%': { transform: 'translate(3px, 3px) rotate(30deg) scale(1)', opacity: 0.7 },
          '40%': { transform: 'translate(8px, 5px) rotate(60deg) scale(1.2)', opacity: 1 },
          '60%': { transform: 'translate(13px, 2px) rotate(90deg) scale(1)', opacity: 0.9 },
          '100%': { transform: 'translateX(25px) rotate(180deg) scale(0)', opacity: 0 }
        },
        'spark-4': {
          '0%': { transform: 'translateX(0) scale(0)', opacity: 0 },
          '20%': { transform: 'translate(3px, -3px) rotate(-30deg) scale(1)', opacity: 0.7 },
          '40%': { transform: 'translate(8px, -5px) rotate(-60deg) scale(1.2)', opacity: 1 },
          '60%': { transform: 'translate(13px, -2px) rotate(-90deg) scale(1)', opacity: 0.9 },
          '100%': { transform: 'translateX(25px) rotate(-180deg) scale(0)', opacity: 0 }
        },
        'spark-5': {
          '0%': { transform: 'translateY(0) scale(0)', opacity: 0 },
          '20%': { transform: 'translate(3px, 3px) rotate(-30deg) scale(1)', opacity: 0.7 },
          '40%': { transform: 'translate(5px, 5px) rotate(-60deg) scale(1.2)', opacity: 1 },
          '60%': { transform: 'translate(2px, 8px) rotate(-90deg) scale(1)', opacity: 0.9 },
          '100%': { transform: 'translateY(20px) rotate(-180deg) scale(0)', opacity: 0 }
        },
        'spark-6': {
          '0%': { transform: 'translateY(0) scale(0)', opacity: 0 },
          '20%': { transform: 'translate(-3px, 3px) rotate(30deg) scale(1)', opacity: 0.7 },
          '40%': { transform: 'translate(-5px, 5px) rotate(60deg) scale(1.2)', opacity: 1 },
          '60%': { transform: 'translate(-2px, 8px) rotate(90deg) scale(1)', opacity: 0.9 },
          '100%': { transform: 'translateY(20px) rotate(180deg) scale(0)', opacity: 0 }
        },
        'spark-7': {
          '0%': { transform: 'translateX(0) scale(0)', opacity: 0 },
          '20%': { transform: 'translate(-3px, 3px) rotate(-30deg) scale(1)', opacity: 0.7 },
          '40%': { transform: 'translate(-8px, 5px) rotate(-60deg) scale(1.2)', opacity: 1 },
          '60%': { transform: 'translate(-13px, 2px) rotate(-90deg) scale(1)', opacity: 0.9 },
          '100%': { transform: 'translateX(-25px) rotate(-180deg) scale(0)', opacity: 0 }
        },
        'spark-8': {
          '0%': { transform: 'translateX(0) scale(0)', opacity: 0 },
          '20%': { transform: 'translate(-3px, -3px) rotate(30deg) scale(1)', opacity: 0.7 },
          '40%': { transform: 'translate(-8px, -5px) rotate(60deg) scale(1.2)', opacity: 1 },
          '60%': { transform: 'translate(-13px, -2px) rotate(90deg) scale(1)', opacity: 0.9 },
          '100%': { transform: 'translateX(-25px) rotate(180deg) scale(0)', opacity: 0 }
        },
        'spark-9': {
          '0%': { transform: 'translate(0, 0) scale(0) rotate(0deg)', opacity: 0 },
          '30%': { transform: 'translate(-3px, -3px) scale(1) rotate(45deg)', opacity: 0.8 },
          '60%': { transform: 'translate(-7px, -7px) scale(1.1) rotate(90deg)', opacity: 1 },
          '100%': { transform: 'translate(-15px, -15px) scale(0) rotate(180deg)', opacity: 0 }
        },
        'spark-10': {
          '0%': { transform: 'translate(0, 0) scale(0) rotate(0deg)', opacity: 0 },
          '30%': { transform: 'translate(3px, -3px) scale(1) rotate(-45deg)', opacity: 0.8 },
          '60%': { transform: 'translate(7px, -7px) scale(1.1) rotate(-90deg)', opacity: 1 },
          '100%': { transform: 'translate(15px, -15px) scale(0) rotate(-180deg)', opacity: 0 }
        },
        'spark-11': {
          '0%': { transform: 'translate(0, 0) scale(0) rotate(0deg)', opacity: 0 },
          '30%': { transform: 'translate(3px, 3px) scale(1) rotate(45deg)', opacity: 0.8 },
          '60%': { transform: 'translate(7px, 7px) scale(1.1) rotate(90deg)', opacity: 1 },
          '100%': { transform: 'translate(15px, 15px) scale(0) rotate(180deg)', opacity: 0 }
        },
        'spark-12': {
          '0%': { transform: 'translate(0, 0) scale(0) rotate(0deg)', opacity: 0 },
          '30%': { transform: 'translate(-3px, 3px) scale(1) rotate(-45deg)', opacity: 0.8 },
          '60%': { transform: 'translate(-7px, 7px) scale(1.1) rotate(-90deg)', opacity: 1 },
          '100%': { transform: 'translate(-15px, 15px) scale(0) rotate(-180deg)', opacity: 0 }
        },
        'celebrate': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: 0 },
          '10%': { transform: 'translateY(-20px) scale(1.1)', opacity: 1 },
          '90%': { transform: 'translateY(-20px) scale(1.1)', opacity: 1 },
          '100%': { transform: 'translateY(-25px) scale(1.1)', opacity: 0 }
        }
      },
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
        'spark-1': 'spark-1 1.2s ease-out forwards',
        'spark-2': 'spark-2 1.2s ease-out forwards 0.1s',
        'spark-3': 'spark-3 1.2s ease-out forwards 0.05s',
        'spark-4': 'spark-4 1.2s ease-out forwards 0.15s',
        'spark-5': 'spark-5 1.2s ease-out forwards 0.1s',
        'spark-6': 'spark-6 1.2s ease-out forwards 0.05s',
        'spark-7': 'spark-7 1.2s ease-out forwards 0.15s',
        'spark-8': 'spark-8 1.2s ease-out forwards 0.1s',
        'spark-9': 'spark-9 1.2s ease-out forwards',
        'spark-10': 'spark-10 1.2s ease-out forwards 0.05s',
        'spark-11': 'spark-11 1.2s ease-out forwards 0.1s',
        'spark-12': 'spark-12 1.2s ease-out forwards 0.15s',
        'celebrate': 'celebrate 1.5s ease-in-out forwards'
      }
    },
  },
  plugins: [],
}
