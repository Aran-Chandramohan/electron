/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // "Electric teal" — more saturated/glowing than Tailwind's stock
        // teal, used for every primary accent (buttons, focus rings,
        // active states, the current-time indicator) against the app's
        // black/near-black backgrounds.
        accent: {
          300: '#6FFFEA',
          400: '#2BFFE0',
          500: '#00E8C9',
          600: '#00BFA3',
          700: '#009985',
        },
      },
    },
  },
  plugins: [],
};
