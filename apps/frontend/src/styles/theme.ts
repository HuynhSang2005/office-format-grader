/**
 * @file theme.ts
 * @description Mantine theme configuration
 * @author Your Name
 */

import { createTheme } from '@mantine/core'


export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
  },
  colors: {
    // Custom color palette
    brand: [
      '#eef3ff',
      '#dce4f5',
      '#b9c7e2',
      '#94a9d1',
      '#748dc2',
      '#5f7cb8',
      '#5471b3',
      '#44619d',
      '#39558c',
      '#2d487b',
    ],
  },
  primaryShade: { light: 6, dark: 8 },
  shadows: {
    md: '0 4px 12px rgba(0, 0, 0, 0.1)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.15)',
  },
  components: {
    Button: {
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    },
    Card: {
      styles: {
        root: {
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
  },
})