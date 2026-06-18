/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#050816',
        sidebar: '#0F172A',
        panel: '#111827',
        surface: '#F5F7FB',
        border: '#E2E8F0',
        primary: { DEFAULT: '#2563EB', hover: '#1D4ED8' },
        accent: { DEFAULT: '#F97316', hover: '#EA580C' },
        success: '#059669',
        danger: '#DC2626',
      },
      boxShadow: { card: '0 10px 30px rgba(15, 23, 42, 0.06)' },
    },
  },
  plugins: [],
}
