/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f172a', // Deep Navy
          light: '#1e293b',
        },
        secondary: {
          DEFAULT: '#0d9488', // Teal
          light: '#14b8a6',
        },
        success: '#10b981', // Green
        warning: '#f59e0b', // Amber
        danger: '#ef4444', // Red
        background: '#f8fafc', // Light blue-gray
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
