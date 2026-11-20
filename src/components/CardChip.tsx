import { Image, StyleSheet, View } from 'react-native';

import type { PaymentMethod } from '@/state/AccountContext';
import { colors, fontFamily } from '@/theme';
import { AppText } from './AppText';

const visa = require('../../assets/visa.png');
const mastercard = require('../../assets/mastercard.png');
const mpesa = require('../../assets/mpesa.png');

type ChipMethod = Pick<PaymentMethod, 'kind'> & { brand?: string };

/** Logo and display size for each method; sizes are tuned so the logos look balanced in the chip. */
function logoFor(method: ChipMethod) {
  if (method.kind === 'mpesa') return { source: mpesa, width: 38, height: (38 * 163) / 442 };
  if (method.brand === 'Visa') return { source: visa, width: 32, height: (32 * 156) / 480 };
  if (method.brand === 'Mastercard') return { source: mastercard, width: 28, height: (28 * 618) / 999 };
  return null;
}

/** Small thumbnail for a payment method: the Visa, Mastercard or M-Pesa logo. */
export function CardChip({ method }: { method: ChipMethod }) {
  const logo = logoFor(method);
  return (
    <View style={styles.chip} accessibilityElementsHidden>
      {logo ? (
        <Image source={logo.source} style={{ width: logo.width, height: logo.height }} resizeMode="contain" />
      ) : (
        <AppText variant="caption" weight="700" style={styles.text}>
          CARD
        </AppText>
      )}
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily, fontSize: 10, letterSpacing: 0.6, color: colors.text.primary },
});
