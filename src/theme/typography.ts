import { Platform, type TextStyle } from 'react-native';

/** SF Pro on iOS, platform system fonts elsewhere. */
export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif',
});

const base: TextStyle = { fontFamily };

export const typography = {
  largeTitle: { ...base, fontSize: 32, lineHeight: 38, fontWeight: '600', letterSpacing: -0.6 },
  title: { ...base, fontSize: 26, lineHeight: 32, fontWeight: '600', letterSpacing: -0.4 },
  section: { ...base, fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: -0.3 },
  headline: { ...base, fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  body: { ...base, fontSize: 16, lineHeight: 22, fontWeight: '400', letterSpacing: -0.2 },
  callout: { ...base, fontSize: 15, lineHeight: 21, fontWeight: '400', letterSpacing: -0.1 },
  subhead: { ...base, fontSize: 14, lineHeight: 19, fontWeight: '400' },
  footnote: { ...base, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { ...base, fontSize: 12, lineHeight: 16, fontWeight: '400' },
  label: { ...base, fontSize: 11, lineHeight: 13, fontWeight: '600', letterSpacing: 1.2 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
