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
        // Unicive brand palette
        unicive: {
          green: '#005941',
          'green-hover': '#00472f',
          'green-light': '#7EBD73',
          'green-pale': '#EBF5E9',
          'green-muted': '#D4EDCF',
          amber: '#E7972A',
          'amber-light': '#FDF3E3',
          'amber-muted': '#F9E2B6',
        },
        // Backwards-compat alias
        'unicv-green': '#005941',
        surface: {
          DEFAULT: '#FAFBFC',
          50: '#FFFFFF',
          100: '#F7F8FA',
          200: '#EFF1F5',
          300: '#E2E5EB',
          400: '#CDD2DA',
          500: '#8A92A0',
          600: '#5C6472',
          700: '#3E4654',
          800: '#2B3340',
          900: '#1A2230',
        },
      },
      fontFamily: {
        heading: ['Kumbh Sans', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Open Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,89,65,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 6px 20px rgba(0,89,65,0.10), 0 2px 6px rgba(0,0,0,0.05)',
        soft: '0 2px 8px rgba(0,0,0,0.06)',
        institution: '0 0 0 1px rgba(0,89,65,0.08), 0 4px 16px rgba(0,89,65,0.08)',
      },
      fontSize: {
        'kpi': ['36px', { lineHeight: '1.05', fontWeight: '700', letterSpacing: '-0.02em' }],
        'kpi-sm': ['26px', { lineHeight: '1.1', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
};

export default config;
