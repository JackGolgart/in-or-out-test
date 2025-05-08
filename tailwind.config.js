/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./node_modules/swiper/**/*.{js,ts,jsx,tsx}" // ensures Tailwind classes in Swiper are processed
  ],
  theme: {
    extend: {
      animation: {
        'slide-down': 'slideDown 0.3s ease-out forwards',
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: 0, transform: 'translateY(-1rem)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
