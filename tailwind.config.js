/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // ✅ important for theme toggling
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
