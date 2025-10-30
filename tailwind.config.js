/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Define your gradient colors for buttons
        primaryBlue: '#667eea', // Example blue
        primaryPurple: '#764ba2', // Example purple
      }
    },
  },
  plugins: [],
}