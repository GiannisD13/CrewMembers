/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:         '#141925',
        'navy-mid':   '#1C2535',
        'navy-light': '#243045',
        gold:         '#A8823A',
        'gold-light': '#C9A560',
        teal:         '#1B5C5C',
        'teal-light': '#287878',
        cream:        '#F2EBE0',
        'cream-dim':  '#E9E0D4',
        'warm-white': '#F8F4EE',
        stone:        '#8A7E72',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans:    ['DM Sans', 'sans-serif'],
      },
      keyframes: {
        fadeUp:      { from:{ opacity:'0', transform:'translateY(18px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        fadeIn:      { from:{ opacity:'0' }, to:{ opacity:'1' } },
        scrollPulse: { '0%,100%':{ opacity:'0.3' }, '50%':{ opacity:'0.8' } },
      },
      animation: {
        'fade-up':     'fadeUp 0.7s ease forwards',
        'fade-in':     'fadeIn 0.5s ease forwards',
        'scroll-pulse':'scrollPulse 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
