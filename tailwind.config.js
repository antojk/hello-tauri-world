/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // or 'class' for manual dark mode
  theme: {
    extend: {
      zIndex: {
        'behind': '-1',
      },
      colors: {
        'primary': {
          '50': '#e6f7ff',
          '100': '#b3e0ff',
          '200': '#80caff',
          '300': '#4db3ff',
          '400': '#1a9dff',
          '500': '#0086e6',
          '600': '#0069b3',
          '700': '#004d80',
          '800': '#00304d',
          '900': '#00141f',
        },
        'secondary': {
          '50': '#f0f9f4',
          '100': '#d0ebda',
          '200': '#b0ddc1',
          '300': '#90cfa7',
          '400': '#70c18e',
          '500': '#50b374',
          '600': '#308e5a',
          '700': '#206940',
          '800': '#104427',
          '900': '#001f0d',
        },
        'accent': {
          '50': '#f7e6ff',
          '100': '#e0b3ff',
          '200': '#ca80ff',
          '300': '#b34dff',
          '400': '#9d1aff',
          '500': '#8600e6',
          '600': '#6900b3',
          '700': '#4d0080',
          '800': '#30004d',
          '900': '#14001f',
        },
      },
    },
  },
  plugins: [],
}
