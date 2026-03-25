/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        dark: '#0f172a',
      },
      boxShadow: {
        soft: '0 20px 45px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        hero: 'linear-gradient(135deg, rgba(99,102,241,.15), rgba(236,72,153,.15))',
      },
    },
  },
  plugins: [],
};
