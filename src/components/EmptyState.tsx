import type { LucideIcon } from 'lucide-react-native';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { colors, spacing } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  /** Illustration shown instead of the icon. */
  image?: ImageSourcePropType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, image, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {image ? (
        <Image source={image} style={styles.image} resizeMode="contain" accessibilityIgnoresInvertColors />
      ) : (
        Icon && (
          <View style={styles.iconWrap}>
            <Icon size={30} color={colors.text.tertiary} strokeWidth={1.5} />
          </View>
        )
      )}
      <AppText variant="headline" align="center">
        {title}
      </AppText>
      <AppText variant="subhead" tone="secondary" align="center" style={styles.message}>
        {message}
      </AppText>
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xxxl,
  },
  iconWrap: {
    marginBottom: spacing.lg,
  },
  image: { width: 150, height: 166, marginBottom: spacing.xl },
  message: { marginTop: 6, maxWidth: 280 },
  action: { marginTop: spacing.xl },
});
