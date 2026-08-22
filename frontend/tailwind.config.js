/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Sans"', 'Roboto', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      colors: {
        google: {
          blue: '#1A73E8',
          'blue-hover': '#1557B0',
          'blue-light': '#E8F0FE',
          red: '#EA4335',
          'red-light': '#FCE8E6',
          yellow: '#FBBC04',
          'yellow-light': '#FEF7E0',
          green: '#34A853',
          'green-light': '#E6F4EA',
          text: '#202124',
          secondary: '#5F6368',
          border: '#DADCE0',
          bg: '#FFFFFF',
          'bg-off': '#F8F9FA',
        },
      },
    },
  },
  plugins: [],
}
