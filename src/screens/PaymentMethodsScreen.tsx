import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CreditCard, Smartphone, Wallet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/ActionSheet';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CardChip } from '@/components/CardChip';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Separator } from '@/components/Separator';
import { methodDetail, methodLabel, useAccount, type PaymentMethod } from '@/state/AccountContext';
import { colors, screenPadding, spacing } from '@/theme';

export function PaymentMethodsScreen() {
  const { bottom } = useSafeAreaInsets();
  const { paymentMethods, defaultPaymentId, setDefaultPayment, removePaymentMethod, planId } = useAccount();
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<PaymentMethod | null>(null);

  const removingLastOnPaidPlan = paymentMethods.length === 1 && planId !== 'free';

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Payment methods" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.xxxl }]}>
        {paymentMethods.length === 0 ? (
          <EmptyState icon={Wallet} title="Nothing added yet" message="Add a card or M-Pesa to subscribe." />
        ) : (
          <View>
            {paymentMethods.map((method, i) => (
              <View key={method.id}>
                {i > 0 && <Separator inset={48 + spacing.lg} />}
                <Pressable
                  onPress={() => setSelected(method)}
                  accessibilityRole="button"
                  accessibilityLabel={`${methodLabel(method)}, ${methodDetail(method)}${method.id === defaultPaymentId ? ', default' : ''}`}
                >
                  {({ pressed }) => (
                    <View style={[styles.row, pressed && styles.pressed]}>
                      <CardChip method={method} />
                      <View style={styles.text}>
                        <AppText variant="body" weight="500">
                          {methodLabel(method)}
                        </AppText>
                        <AppText variant="footnote" tone="secondary">
                          {methodDetail(method)}
                        </AppText>
                      </View>
                      {method.id === defaultPaymentId && (
                        <AppText variant="footnote" tone="secondary">
                          Default
                        </AppText>
                      )}
                    </View>
                  )}
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <Button
            label="Add card"
            variant="secondary"
            icon={<CreditCard size={18} color={colors.ink} strokeWidth={1.8} />}
            onPress={() => router.push('/payment-methods/add')}
            style={styles.flex}
          />
          <Button
            label="Add M-Pesa"
            variant="secondary"
            icon={<Smartphone size={18} color={colors.ink} strokeWidth={1.8} />}
            onPress={() => router.push('/payment-methods/mpesa')}
            style={styles.flex}
          />
        </View>
      </ScrollView>

      <ActionSheet
        visible={!!selected}
        title={selected ? methodLabel(selected) : undefined}
        onClose={() => setSelected(null)}
        actions={
          selected
            ? [
                ...(selected.id !== defaultPaymentId
                  ? [{ label: 'Make default', onPress: () => setDefaultPayment(selected.id) }]
                  : []),
                { label: 'Remove', destructive: true, onPress: () => setConfirmRemove(selected) },
              ]
            : []
        }
      />
      <ConfirmSheet
        visible={!!confirmRemove}
        title={confirmRemove ? `Remove ${methodLabel(confirmRemove)}?` : ''}
        message={removingLastOnPaidPlan ? 'Your plan renews with this. Add another before it renews.' : undefined}
        confirmLabel="Remove"
        destructive
        onCancel={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (confirmRemove) removePaymentMethod(confirmRemove.id);
          setConfirmRemove(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingHorizontal: screenPadding, gap: spacing.xxl, width: '100%', maxWidth: 560, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg },
  pressed: { opacity: 0.5 },
  text: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
