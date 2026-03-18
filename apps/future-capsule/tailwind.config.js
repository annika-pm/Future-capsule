// const { createGlobPatternsForDependencies } = require('@nx/next/tailwind');

// The above utility import will not work if you are using Next.js' --turbo.
// Instead you will have to manually add the dependent paths to be included.
// For example
// ../libs/buttons/**/*.{ts,tsx,js,jsx,html}',                 <--- Adding a shared lib
// !../libs/buttons/**/*.{stories,spec}.{ts,tsx,js,jsx,html}', <--- Skip adding spec/stories files from shared lib

// If you are **not** using `--turbo` you can uncomment both lines 1 & 19.
// A discussion of the issue can be found: https://github.com/nrwl/nx/issues/26510

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
    '!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        purple: {
          600: '#6B39F2',
          500: '#7c3aed',
          400: '#a78bfa',
          700: '#5b21b6',
          50: '#faf5ff',
          900: '#21005d',
          950: '#14003b',
        },
        blue: {
          400: '#00D9FF',
          500: '#0099cc',
          600: '#0077aa',
        },
        gray: {
          900: '#0F0F14',
          800: '#1a1a1f',
          700: '#2d2d33',
          600: '#404048',
          500: '#52525b',
          400: '#a1a1aa',
          300: '#d4d4d8',
          200: '#e4e4e7',
          100: '#f4f4f5',
          50: '#fafafa',
        },
      },
      backgroundColor: {
        dark: '#0F0F14',
        'dark-secondary': '#1a1a1f',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(107, 57, 242, 0.3)',
        'glow-blue': '0 0 20px rgba(0, 217, 255, 0.3)',
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #6B39F2 0%, #5B3A91 100%)',
        'gradient-blue': 'linear-gradient(135deg, #00D9FF 0%, #0077aa 100%)',
        'gradient-dark': 'linear-gradient(180deg, #1a1a1f 0%, #0F0F14 100%)',
      },
    },
  },
  plugins: [],
};
