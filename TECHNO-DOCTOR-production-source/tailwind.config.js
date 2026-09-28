/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Calibri', 'Carlito', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Calibri', 'Carlito', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Тёмно-синяя неоновая схема как на флаере
        brand: {
          50: '#e6f0ff',
          100: '#c3daff',
          200: '#8fbcff',
          300: '#5c9aff',
          400: '#2f7bff',
          500: '#1a5df0',
          600: '#0d2a66',
          700: '#0a1f4d',
          800: '#061433',
          900: '#040d24',
          950: '#02060f',
        },
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up': 'slideUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'section-in': 'sectionIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'section-out': 'sectionOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'menu-in': 'menuIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'neon-flash': 'neonFlash 0.7s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(18px) scale(0.99)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        sectionIn: {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        sectionOut: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-14px) scale(0.98)' },
        },
        menuIn: {
          '0%': { opacity: '0', transform: 'scale(0.99)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        neonFlash: {
          '0%': { boxShadow: '0 0 0 0 rgba(34, 211, 238, 0)' },
          '35%': { boxShadow: '0 0 24px 4px rgba(34, 211, 238, 0.5)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34, 211, 238, 0)' },
        },
      },
    },
  },
  plugins: [],
};
