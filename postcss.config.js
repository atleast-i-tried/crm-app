/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // ✅ Correct way for Tailwind v4+
    autoprefixer: {},
  },
};
