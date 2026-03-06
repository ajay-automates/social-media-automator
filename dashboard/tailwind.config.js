/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Instrument Serif', 'Georgia', 'serif'],
        'body': ['DM Sans', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      colors: {
        accent: {
          DEFAULT: '#22d3ee',
          hover: '#06b6d4',
          muted: 'rgba(34, 211, 238, 0.1)',
          glow: 'rgba(34, 211, 238, 0.15)',
        },
      },
    },
  },
  plugins: [],
}
