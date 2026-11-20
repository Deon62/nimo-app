import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CardChip } from '@/components/CardChip';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, screenPadding, spacing } from '@/theme';

/**
 * Cards are entered on Paystack's secure page, never in the app. Paystack saves the card
 * the first time you pay with it, and it then appears in Payment methods.
 */
export function AddCardScreen() {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Add card" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.xl }]}>
        <View style={styles.head}>
          <View style={styles.chips}>
            <CardChip method={{ kind: 'card', brand: 'Visa' }} />
            <CardChip method={{ kind: 'card', brand: 'Mastercard' }} />
          </View>
          <AppText variant="title">Your card stays with Paystack</AppText>
          <AppText variant="subhead" tone="secondary">
            Pay for a plan by card and enter it on Paystack’s secure page. It’s saved there, so next time you
            pay in one tap. Nimo never sees your card number.
          </AppText>
        </View>
        <View style={styles.footer}>
          <Button label="Choose a plan" size="large" onPress={() => router.replace('/plans')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: {
    flexGrow: 1,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.xxxl,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  head: { gap: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.sm },
  footer: { marginTop: 'auto' },
});
