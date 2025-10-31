// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#4A90E2', // Your desired blue
        'primary-purple': '#9B51E0', // Your desired purple
      },
      backgroundImage: {
        'gradient-button': 'linear-gradient(to right, #4A90E2, #9B51E0)', // Gradient for buttons
      },
    },
  },
  plugins: [],
}
export default config