/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        golden: {
          DEFAULT: '#D4AF37',
          light: '#F5D76E',
          dark: '#B8860B',
        },
        fire: {
          DEFAULT: '#E74C3C',
          red: '#C0392B',
          orange: '#F39C12',
        },
      },
    },
  },
  plugins: [],
}