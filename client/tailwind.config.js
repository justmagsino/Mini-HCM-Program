/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        success: '#16a34a',
        danger: '#dc2626',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        'page-title': ['1.75rem', { lineHeight: '2.125rem', fontWeight: '700' }],
        'section-title': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
      },
      borderRadius: {
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
};
