/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: { colors: { zinc: { 750: '#2d2d33', 850: '#1f1f24', 950: '#0c0c0e' } } },
  },
  plugins: [],
}
