import { StyleSheet, View } from 'react-native';

import type { PaymentMethod } from '@/state/AccountContext';
import { colors, fontFamily } from '@/theme';
import { AppText } from './AppText';

const MPESA_GREEN = '#3BA935';

function label(method: Pick<PaymentMethod, 'kind'> & { brand?: string }): string {
  if (method.kind === 'mpesa') return 'M-PESA';
  return method.brand === 'Visa' ? 'VISA' : method.brand === 'Mastercard' ? 'MC' : 'CARD';
}

/** Small thumbnail for a payment method: the card brand, or M-Pesa. */
export function CardChip({ method }: { method: Pick<PaymentMethod, 'kind'> & { brand?: string } }) {
  const mpesa = method.kind === 'mpesa';
  return (
    <View style={[styles.chip, mpesa && styles.mpesa]} accessibilityElementsHidden>
      <AppText variant="caption" weight="700" style={[styles.text, mpesa && styles.mpesaText]}>
        {label(method)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: 48,
    height: 32,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mpesa: { borderColor: 'rgba(59, 169, 53, 0.35)', backgroundColor: 'rgba(59, 169, 53, 0.08)' },
  text: { fontFamily, fontSize: 10, letterSpacing: 0.6, color: colors.text.primary },
  mpesaText: { fontSize: 8.5, color: MPESA_GREEN, letterSpacing: 0.3 },
});
