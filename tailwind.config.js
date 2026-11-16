/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#080919',
          raised: '#0d0f24',
          surface: '#12142e',
          hover: '#181b3a',
          active: '#1e2247',
        },
        border: {
          DEFAULT: '#23264a',
          subtle: '#1a1d3d',
          strong: '#2e3260',
        },
        accent: {
          DEFAULT: '#6c8cff',
          hover: '#85a0ff',
          muted: '#4a63c4',
          subtle: 'rgba(108, 140, 255, 0.12)',
        },
        text: {
          primary: '#e8eaf6',
          secondary: '#9ba0c3',
          muted: '#6b7099',
          inverse: '#080919',
        },
        success: '#4ade80',
        warning: '#fbbf24',
        danger: '#f87171',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        button: '8px',
      },
      spacing: {
        '18': '4.5rem',
      },
      maxWidth: {
        content: '72rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'rainbow-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'rainbow': 'rainbow-shift 3s linear infinite',
      },
    },
  },
  plugins: [],
};