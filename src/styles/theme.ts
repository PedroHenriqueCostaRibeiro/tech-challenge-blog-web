/**
 * Tema unico da aplicacao.
 *
 * Os pares de cor foram escolhidos para atender contraste minimo de 4.5:1
 * (WCAG AA) sobre `surface` (#ffffff) ou `background` (#f8fafc).
 */
export const theme = {
  colors: {
    primary: '#1d4ed8',
    primaryDark: '#1e3a8a',
    primarySoft: '#dbeafe',

    text: '#1f2937',
    textMuted: '#4b5563',

    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',

    danger: '#b91c1c',
    dangerSoft: '#fee2e2',
    success: '#15803d',
    successSoft: '#dcfce7',
  },

  /** Mobile-first: usados como `min-width` para ampliar o layout. */
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
  },

  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },

  /** Escala de 4px: spacing(4) = 16px. Evita numeros magicos no CSS. */
  spacing: (steps: number) => `${steps * 4}px`,

  maxWidth: '1120px',
}

export type AppTheme = typeof theme
