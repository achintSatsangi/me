/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#FAF7F2',
        ink: '#1A1A1A',
        rust: '#A0421C',
        petrol: '#1F4E5F',
        muted: '#6E6A62',
        rule: '#D9D3C6',
        'paper-dark': '#0F0F10',
        'ink-dark': '#F0EBE0',
        'rust-dark': '#D9662F',
        'muted-dark': '#8A8577',
        'rule-dark': '#2A2825',
      },
      maxWidth: {
        prose: '65ch',
        editorial: '72rem',
      },
    },
  },
  plugins: [],
};
