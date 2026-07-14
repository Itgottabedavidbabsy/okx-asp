/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        okx: {
          bg:    '#0c1628',
          surf:  '#111e35',
          card:  '#16233f',
          card2: '#1c2c4e',
          gold:  '#f5b800',
          gold2: '#d9a200',
          blue:  '#1677ff',
          green: '#00c087',
          red:   '#f5475b',
          teal:  '#06b6d4',
          txt:   '#dce6f5',
          sub:   '#6677a0',
          muted: '#3a4f6e',
        },
      },
      fontFamily: { sans: ['-apple-system','BlinkMacSystemFont','Segoe UI','sans-serif'] },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.07)',
        strong:  'rgba(255,255,255,0.14)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
