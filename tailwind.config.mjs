/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#FBFBFD',
        ink: '#1D1D1F',
        accent: '#0071E3',
        muted: '#6E6E73',
        rule: '#D2D2D7',
        'paper-dark': '#0A0A0C',
        'linkedin': '#0A66C2',
        'ink-dark': '#F5F5F7',
        'accent-dark': '#2997FF',
        'muted-dark': '#86868B',
        'rule-dark': '#2C2C2E',
      },
      maxWidth: {
        prose: '65ch',
        editorial: '80rem',
      },
      letterSpacing: {
        tightest: '-0.035em',
        tighter: '-0.025em',
      },
    },
  },
  plugins: [],
};
