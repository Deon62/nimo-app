import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CardChip } from '@/components/CardChip';
import { FormField } from '@/components/FormField';
import { goBackOr, ScreenHeader } from '@/components/ScreenHeader';
import { useAccount } from '@/state/AccountContext';
import { colors, screenPadding, spacing } from '@/theme';
import {
  detectBrand,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  isValidCardNumber,
  isValidCvc,
  isValidExpiry,
  TEST_CARD,
} from '@/utils/card';

/**
 * Card entry form (test mode: any 16 digits is accepted). Only the brand, last four digits,
 * expiry and name are kept. When payments go live, replace this with the payment provider's
 * secure card field (e.g. Stripe CardField) so raw card numbers never touch the app.
 */
export function AddCardScreen() {
  const { bottom } = useSafeAreaInsets();
  const { addPaymentMethod, profile } = useAccount();
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [holder, setHolder] = useState(`${profile.firstName} ${profile.lastName}`.trim());
  const [submitted, setSubmitted] = useState(false);

  const brand = detectBrand(number);
  const errors = {
    number: isValidCardNumber(number) ? undefined : 'Enter all 16 digits',
    expiry: isValidExpiry(expiry) ? undefined : 'Use a future date, MM/YY',
    cvc: isValidCvc(cvc) ? undefined : '3 digits',
    holder: holder.trim() ? undefined : 'Enter the name on the card',
  };
  const valid = Object.values(errors).every((e) => !e);

  const save = () => {
    setSubmitted(true);
    if (!valid) return;
    addPaymentMethod({
      kind: 'card',
      brand,
      last4: digitsOnly(number).slice(-4),
      expiry: formatExpiry(expiry),
      holder: holder.trim(),
    });
    goBackOr('/profile');
  };

  const show = (error: string | undefined) => (submitted ? error : undefined);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Add card" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fields}>
          <FormField
            label="Card number"
            value={number}
            onChangeText={(v) => setNumber(formatCardNumber(v))}
            placeholder="1234 1234 1234 1234"
            keyboardType="number-pad"
            autoComplete="cc-number"
            textContentType="creditCardNumber"
            error={show(errors.number)}
            trailing={digitsOnly(number).length > 0 ? <CardChip method={{ kind: 'card', brand }} /> : undefined}
          />
          <View style={styles.pair}>
            <FormField
              label="Expiry"
              value={expiry}
              onChangeText={(v) => setExpiry(formatExpiry(v))}
              placeholder="MM/YY"
              keyboardType="number-pad"
              autoComplete="cc-exp"
              error={show(errors.expiry)}
            />
            <FormField
              label="Security code"
              value={cvc}
              onChangeText={(v) => setCvc(digitsOnly(v).slice(0, 3))}
              placeholder="123"
              keyboardType="number-pad"
              autoComplete="cc-csc"
              secureTextEntry
              error={show(errors.cvc)}
            />
          </View>
          <FormField
            label="Name on card"
            value={holder}
            onChangeText={setHolder}
            autoComplete="cc-name"
            textContentType="name"
            error={show(errors.holder)}
          />
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => {
              setNumber(TEST_CARD.number);
              setExpiry(TEST_CARD.expiry);
              setCvc(TEST_CARD.cvc);
            }}
            hitSlop={8}
            accessibilityRole="button"
            style={styles.testCard}
          >
            <AppText variant="subhead" weight="600" align="center">
              Use a test card
            </AppText>
          </Pressable>
          <AppText variant="footnote" tone="secondary" align="center">
            Test mode: cards aren’t charged.
          </AppText>
          <Button label="Save card" size="large" onPress={save} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  fields: { gap: spacing.xxl },
  pair: { flexDirection: 'row', gap: spacing.lg },
  footer: { marginTop: 'auto', gap: spacing.md },
  testCard: { paddingVertical: spacing.sm },
});
