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
        unicv: {
          green: '#4E6930',
          'green-light': '#5F7D3B',
          'green-dark': '#3D5226',
          gold: '#D99528',
          'gold-light': '#E5AD4A',
          'gold-dark': '#B87D1F',
        },
        surface: {
          DEFAULT: '#FAFBFC',
          50: '#FFFFFF',
          100: '#F7F8FA',
          200: '#EFF1F5',
          300: '#E2E5EB',
          400: '#CDD2DA',
          500: '#A0A8B4',
          600: '#6B7280',
          700: '#4B5563',
          800: '#374151',
          900: '#1F2937',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '10px',
        xl: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        soft: '0 2px 8px rgba(0,0,0,0.06)',
      },
      fontSize: {
        'kpi': ['28px', { lineHeight: '1.1', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
};

export default config;
