import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tabBar } from '@/theme';

/** Distance from the screen's bottom edge to the floating tab bar. */
export function useTabBarBottomOffset(): number {
  const { bottom } = useSafeAreaInsets();
  // Sit just above the home indicator on notched devices; float clear of the edge elsewhere.
  return bottom > 0 ? Math.max(bottom - 8, 12) : 16;
}

/** Bottom padding scrollable tab screens need so content clears the floating bar. */
export function useTabBarInset(extra = 24): number {
  return useTabBarBottomOffset() + tabBar.height + extra;
}
