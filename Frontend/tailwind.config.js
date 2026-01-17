export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Soft teal - trustworthy, calm, hopeful
        primary: {
          50: '#f0f9f7',
          100: '#d9f0eb',
          200: '#b5e1d8',
          300: '#84cabe',
          400: '#56aea0',
          500: '#3d9486',
          600: '#2f766c',
          700: '#295f58',
          800: '#254d48',
          900: '#22413d',
        },
        // Secondary: Warm terracotta - human, earthy
        secondary: {
          50: '#fdf6f3',
          100: '#fbeae4',
          200: '#f7d5c9',
          300: '#f1b8a4',
          400: '#e89275',
          500: '#db6f4d',
          600: '#c85a3a',
          700: '#a74830',
          800: '#893e2c',
          900: '#713729',
        },
        // Neutrals: Warm grays with slight warmth
        warm: {
          50: '#fafaf9',
          100: '#f5f4f2',
          200: '#e8e6e3',
          300: '#d6d3ce',
          400: '#a8a49d',
          500: '#7c776f',
          600: '#5f5a53',
          700: '#4a4641',
          800: '#3d3a36',
          900: '#2d2b28',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Georgia', 'Cambria', 'serif'],
      },
    }
  },
  plugins: []
}
