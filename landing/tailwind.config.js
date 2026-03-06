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
        base: {
          DEFAULT: '#0a0a0b',
          secondary: '#111113',
          elevated: '#18181b',
          hover: '#1f1f23',
        },
        accent: {
          DEFAULT: '#22d3ee',
          hover: '#06b6d4',
          muted: 'rgba(34, 211, 238, 0.1)',
          glow: 'rgba(34, 211, 238, 0.15)',
        },
        txt: {
          primary: '#fafafa',
          secondary: '#a1a1aa',
          muted: '#52525b',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          hover: 'rgba(255, 255, 255, 0.12)',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-up-delay-1': 'fadeUp 0.6s ease-out 0.1s forwards',
        'fade-up-delay-2': 'fadeUp 0.6s ease-out 0.2s forwards',
        'fade-up-delay-3': 'fadeUp 0.6s ease-out 0.3s forwards',
        'underline-grow': 'underlineGrow 0.8s ease-out 0.5s forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        underlineGrow: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
    },
  },
  plugins: [],
}
