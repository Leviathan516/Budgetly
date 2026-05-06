/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: '#1a1a1a',
        cream: '#f4f0e8',
        moss: '#5a6f4a',
        rust: '#c4633f',
        ochre: '#d4a04c',
      },
    },
  },
  plugins: [],
};
