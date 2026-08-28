import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        wanted: ['var(--font-wanted-sans)', 'sans-serif'],
        recipekorea: ['var(--font-recipekorea)', 'sans-serif'],
      },
      colors: {
        primary: '#233067',
        secondary: '#38427b',
        accent: {
          DEFAULT: '#38427b',
          contrast: '#6485da',
          contrastHover: '#829ee8',
          contrastSurface: '#4567c5',
        },
        darkActive: '#171717',
        background: {
          light: '#f5f5f5',
          dark: '#212121',
        },
        text: {
          light: '#333',
          dark: '#f5f5f5',
        },
      },
      container: {
        center: true,
        screens: {
          md: '800px',
          lg: '1024px',
        },
      },

      typography: (theme: (path: string) => string) => ({
        DEFAULT: {
          css: {
            h1: {
              marginTop: '1.7em',
              marginBottom: '0.5em',
              lineHeight: '1.2',
              fontSize: '1.5rem',
              '@screen md': {
                fontSize: '1.8rem',
              },
              '@screen lg': {
                fontSize: '2rem',
              },
            },
            h2: {
              marginTop: '1.6em',
              marginBottom: '0.5em',
              lineHeight: '1.3',
              fontSize: '1.25rem',
              '@screen md': {
                fontSize: '1.5rem',
              },
              '@screen lg': {
                fontSize: '1.75rem',
              },
            },
            h3: {
              marginTop: '1.5em',
              marginBottom: '0.5em',
              lineHeight: '1.4',
              fontSize: '1.125rem',
              '@screen md': {
                fontSize: '1.25rem',
              },
              '@screen lg': {
                fontSize: '1.5rem',
              },
            },
            p: {
              marginBottom: '0.8em',
              lineHeight: '1.6',
            },
            img: {
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
            },
            blockquote: {
              fontStyle: 'italic',
              color: theme('colors.gray.700'),
              borderLeft: `4px solid ${theme('colors.accent.DEFAULT')}`,
              padding: '0 1rem',
              margin: '1.5rem 0',
              'p::before': { content: 'none' },
              'p::after': { content: 'none' },
            },
            code: {
              backgroundColor: theme('colors.gray.200'),
              color: theme('colors.text.light'),
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
            },
            pre: {
              backgroundColor: theme('colors.gray.200'),
              color: theme('colors.text.light'),
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.text.dark'),
            a: {
              color: theme('colors.accent.contrast'),
              '&:hover': {
                color: theme('colors.accent.contrastHover'),
              },
            },
            blockquote: {
              borderLeftColor: theme('colors.accent.contrastSurface'),
              color: theme('colors.gray.300'),
            },
            h1: {
              color: theme('colors.text.dark'),
            },
            h2: {
              color: theme('colors.text.dark'),
            },
            h3: {
              color: theme('colors.text.dark'),
            },
            strong: { color: theme('colors.text.dark') },
            code: {
              backgroundColor: theme('colors.gray.700'),
              color: theme('colors.text.dark'),
            },
            pre: {
              backgroundColor: theme('colors.gray.700'),
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
} satisfies Config;
