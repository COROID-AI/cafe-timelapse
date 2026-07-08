/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 1945: Warm sepia, wood tones
        'era-1945': {
          50: '#fdf8f3',
          100: '#fae9db',
          200: '#f5cbb4',
          300: '#eea080',
          400: '#e2704d',
          500: '#d45a2e',
          600: '#b94420',
          700: '#92361b',
          800: '#6e2a16',
          900: '#4a1a0e',
        },
        // 1965: Pastels, bright colors
        'era-1965': {
          50: '#fdf2fe',
          100: '#fce8ff',
          200: '#f9cfff',
          300: '#f4a3ff',
          400: '#ec6fff',
          500: '#e633ff',
          600: '#d900ff',
          700: '#b300cc',
          800: '#8c0099',
          900: '#660066',
        },
        // 1985: Neon accents, bold
        'era-1985': {
          50: '#fff0f0',
          100: '#ffdddd',
          200: '#ffb3b3',
          300: '#ff7a7a',
          400: '#ff3d3d',
          500: '#ff0000',
          600: '#cc0000',
          700: '#990000',
          800: '#660000',
          900: '#330000',
        },
        // 2005: Minimalist, chrome
        'era-2005': {
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
          900: '#000000',
        },
        // 2025: Modern, clean
        'era-2025': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // 2055: Futuristic, holographic
        'era-2055': {
          50: '#f5feff',
          100: '#ccfbff',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#164e63',
          900: '#172554',
        },
      },
      fontFamily: {
        'vintage': ['"Courier New"', 'monospace'],
        'modern': ['Inter', 'system-ui'],
        'futuristic': ['"Orbitron"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px theme(colors.primary-400)' },
          '100%': { boxShadow: '0 0 20px theme(colors.primary-600)' },
        },
      },
    },
  },
  plugins: [],
}