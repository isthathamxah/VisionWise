/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // All theme-aware via CSS variables (see index.css)
        bg:       'rgb(var(--bg) / <alpha-value>)',
        surface:  'rgb(var(--surface) / <alpha-value>)',
        surface2: 'rgb(var(--surface2) / <alpha-value>)',
        border:   'rgb(var(--border) / <alpha-value>)',
        text:     'rgb(var(--text) / <alpha-value>)',
        muted:    'rgb(var(--muted) / <alpha-value>)',
        faint:    'rgb(var(--faint) / <alpha-value>)',
        brand:    'rgb(var(--brand) / <alpha-value>)',
        brandStrong: 'rgb(var(--brand-strong) / <alpha-value>)',
        brandSoft:   'rgb(var(--brand-soft) / <alpha-value>)',
        good:     'rgb(var(--good) / <alpha-value>)',
        neutral:  'rgb(var(--neutral) / <alpha-value>)',
        bad:      'rgb(var(--bad) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans:    ['Inter', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'monospace'],
      },
      maxWidth: {
        container: '1180px',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        card:  '0 1px 2px rgb(var(--shadow) / 0.04), 0 8px 24px rgb(var(--shadow) / 0.06)',
        pop:   '0 8px 40px rgb(var(--shadow) / 0.14)',
        brand: '0 8px 30px rgb(var(--brand) / 0.28)',
      },
      animation: {
        'reveal':    'reveal 0.7s cubic-bezier(0.22,1,0.36,1) forwards',
        'float':     'float 6s ease-in-out infinite',
        'float-slow':'float 9s ease-in-out infinite',
        'scan':      'scan 2.6s ease-in-out infinite',
        'marquee':   'marquee 26s linear infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'ring':      'ring 2.4s ease-out infinite',
      },
      keyframes: {
        reveal: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float:  { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        scan:   { '0%': { top: '6%', opacity: '0' }, '12%': { opacity: '1' }, '88%': { opacity: '1' }, '100%': { top: '92%', opacity: '0' } },
        marquee:{ '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        pulseDot:{ '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        ring:   { '0%': { transform: 'scale(0.8)', opacity: '0.7' }, '100%': { transform: 'scale(1.8)', opacity: '0' } },
      },
    },
  },
  plugins: [],
}
