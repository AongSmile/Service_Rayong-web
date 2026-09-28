export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#F4F1EA', hi: '#FBFAF5', lo: '#ECE8DD' },
        ink: { DEFAULT: '#1C1912', soft: '#5C574B', panel: '#211E16', deep: '#17150F', line: '#3B3628' },
        accent: { DEFAULT: '#B5401F', soft: '#F1DDD2', dark: '#E2663B' },
        line: '#D9D3C4',
        muted: '#A29B89',
      },
      fontFamily: {
        sans: ['Anuphan', 'sans-serif'],
        serif: ['"Noto Serif Thai"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: { hard: '5px 5px 0 #1C1912', hardAccent: '4px 4px 0 #B5401F' },
    },
  },
  plugins: [],
};