import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        property: {
          50: '#f0f4ff',
          100: '#dce3ff',
          200: '#bac8ff',
          300: '#8da6ff',
          400: '#5a7dff',
          500: '#3b5bdb',
          600: '#2b44a8',
          700: '#1e3075',
          800: '#141f4d',
          900: '#0a0e1a',
        },
        gold: {
          DEFAULT: '#c9a84c',
          dim: '#c9a84c',
          light: '#e8d48b',
          dark: '#8a7332',
        },
        vault: {
          bg: '#0a0e1a',
          surface: '#111827',
          border: '#1f2937',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 168, 76, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(201, 168, 76, 0.3)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
