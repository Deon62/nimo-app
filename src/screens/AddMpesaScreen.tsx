import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CardChip } from '@/components/CardChip';
import { FormField } from '@/components/FormField';
import { goBackOr, ScreenHeader } from '@/components/ScreenHeader';
import { errorMessage } from '@/lib/api';
import { useAccount } from '@/state/AccountContext';
import { colors, screenPadding, spacing } from '@/theme';
import { formatKenyanPhone, normaliseKenyanPhone } from '@/utils/mpesa';

/** Adds an M-Pesa number. Payments to it arrive as a PIN prompt (STK push) on the phone. */
export function AddMpesaScreen() {
  const { bottom } = useSafeAreaInsets();
  const { addMpesaNumber } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const normalised = normaliseKenyanPhone(phone);

  const save = async () => {
    setSubmitted(true);
    if (!normalised) return;
    setBusy(true);
    setError(null);
    try {
      await addMpesaNumber(normalised);
      goBackOr('/profile');
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="M-Pesa" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.head}>
          <CardChip method={{ kind: 'mpesa' }} />
          <AppText variant="subhead" tone="secondary">
            Pay with your Safaricom number. You’ll confirm each payment with your M-Pesa PIN.
          </AppText>
        </View>

        <FormField
          label="M-Pesa number"
          value={phone}
          onChangeText={(v) => setPhone(formatKenyanPhone(v))}
          placeholder="0712 345 678"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          error={submitted && !normalised ? 'Enter a valid Kenyan mobile number' : undefined}
        />

        <View style={styles.footer}>
          {error ? (
            <AppText variant="footnote" tone="danger" align="center" style={styles.error}>
              {error}
            </AppText>
          ) : null}
          <Button label="Add M-Pesa" size="large" onPress={save} loading={busy} />
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
  head: { gap: spacing.md },
  footer: { marginTop: 'auto' },
  error: { marginBottom: spacing.md },
});
