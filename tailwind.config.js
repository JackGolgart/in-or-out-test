/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./node_modules/swiper/**/*.{js,ts,jsx,tsx}" // ensures Tailwind classes in Swiper are processed
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
