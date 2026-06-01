/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /** Slate blue — primary buttons & links (Cornerstone CTA) */
        primary: {
          DEFAULT: '#3E6D8E',
          dark: '#2F5875',
          light: '#D1E3F0',
        },
        /** Deep navy — headings & brand */
        navy: {
          DEFAULT: '#1A365D',
          deep: '#003B5C',
        },
        /** Warm off-white page background */
        cream: {
          DEFAULT: '#FAF9F6',
          card: '#F1EDE4',
        },
        /** Body & secondary text */
        ink: {
          DEFAULT: '#4A5568',
          muted: '#64748B',
          light: '#94A3B8',
        },
        /** Subtle borders & dividers */
        line: {
          DEFAULT: '#E0DCD0',
          strong: '#D4CFC4',
        },
        success: '#16a34a',
        danger: '#dc2626',
        /* Remap common slate utilities to the warm palette */
        slate: {
          50: '#FAF9F6',
          100: '#F1EDE4',
          200: '#E0DCD0',
          300: '#D4CFC4',
          400: '#94A3B8',
          500: '#64748B',
          600: '#4A5568',
          700: '#3D4F5F',
          800: '#1A365D',
          900: '#1A365D',
          950: '#003B5C',
        },
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
        card: '0 1px 2px 0 rgb(26 54 93 / 0.04), 0 1px 3px 0 rgb(26 54 93 / 0.06)',
      },
      borderRadius: {
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
};
