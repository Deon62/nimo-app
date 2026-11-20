export const colors = {
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F7',
    tertiary: '#FAFAFA',
  },
  text: {
    primary: '#1C1C1E',
    secondary: '#8E8E93',
    tertiary: '#AEAEB2',
    inverse: '#FFFFFF',
  },
  accent: {
    blue: '#007AFF',
    blueSoft: 'rgba(0, 122, 255, 0.10)',
    success: '#34C759',
    danger: '#FF3B30',
  },
  border: '#E5E5EA',
  /** Primary ink used for actions, active states and icons. */
  ink: '#1C1C1E',
  dark: {
    surface: '#1C1C1E',
    elevated: '#2C2C2E',
    textSecondary: 'rgba(235, 235, 245, 0.6)',
    textTertiary: 'rgba(235, 235, 245, 0.3)',
  },
} as const;

export type Colors = typeof colors;
