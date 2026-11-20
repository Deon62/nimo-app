export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

/** Horizontal gutter used by every screen. */
export const screenPadding = 20;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/** Minimum comfortable touch target (Apple HIG: 44pt). */
export const hitTarget = 44;

/** Geometry of the floating glass tab bar, shared with screens for bottom insets. */
export const tabBar = {
  height: 66,
  /** Width of the floating tab bar; the minimised call bar matches it. */
  width: 256,
  horizontalMargin: 20,
  bottomGap: 10,
} as const;
