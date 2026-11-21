import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Check, Gem } from 'lucide-react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/ActionSheet';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CardChip } from '@/components/CardChip';
import { EmptyState } from '@/components/EmptyState';
import { PeriodToggle } from '@/components/PeriodToggle';
import { goBackOr, ScreenHeader } from '@/components/ScreenHeader';
import { Separator } from '@/components/Separator';
import { formatMoney, getPlan, priceFor, YEARLY_DISCOUNT } from '@/data/plans';
import { errorMessage } from '@/lib/api';
import { payWithMpesa, payWithNewCard, payWithSavedCard } from '@/lib/payments';
import { methodLabel, useAccount, type BillingPeriod, type PaymentMethod } from '@/state/AccountContext';
import { withAlpha } from '@/utils/color';
import { toKes } from '@/utils/mpesa';
import { colors, screenPadding, spacing } from '@/theme';

/** Pay with a card entered on Paystack's page (it's saved afterwards). */
const NEW_CARD = 'new-card';
const NEW_CARD_METHOD = { kind: 'card', brand: 'Card' } as const;

function renewalDate(period: BillingPeriod): string {
  const d = new Date();
  if (period === 'monthly') d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <AppText variant={strong ? 'headline' : 'body'} tone={strong ? 'primary' : 'secondary'}>
        {label}
      </AppText>
      <AppText variant={strong ? 'headline' : 'body'} style={styles.amount}>
        {value}
      </AppText>
    </View>
  );
}

/**
 * Plan checkout. Cards pay on Paystack (or one tap with a saved card); M-Pesa sends a PIN prompt.
 * Plans don't renew automatically: each payment buys a month or a year.
 */
export function CheckoutScreen() {
  const { plan: planParam } = useLocalSearchParams<{ plan: string }>();
  const { bottom } = useSafeAreaInsets();
  const account = useAccount();
  const plan = getPlan(planParam);
  const [period, setPeriod] = useState<BillingPeriod>(account.billingPeriod ?? 'monthly');
  const [cardId, setCardId] = useState<string | null>(null);
  const [choosingCard, setChoosingCard] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [promptKes, setPromptKes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!plan) {
    return (
      <View style={styles.screen}>
        <ScreenHeader />
        <EmptyState icon={Gem} title="Plan not found" message="Choose a plan to continue." />
      </View>
    );
  }

  const free = plan.id === 'free';
  const current = account.planId === plan.id && (free || account.billingPeriod === period);
  const chosenId = cardId ?? account.defaultPaymentId ?? NEW_CARD;
  const card: PaymentMethod | null = account.paymentMethods.find((m) => m.id === chosenId) ?? null;
  const total = priceFor(plan, period);
  const monthlyEquivalent = period === 'yearly' ? total / 12 : total;

  const mpesa = card?.kind === 'mpesa';

  const pay = async () => {
    setProcessing(true);
    setError(null);
    try {
      if (card?.kind === 'mpesa') await payWithMpesa(plan.id, period, card.phone, setPromptKes);
      else if (card) await payWithSavedCard(plan.id, period, card.id);
      else await payWithNewCard(plan.id, period);
      await account.refresh().catch(() => {});
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setProcessing(false);
      setPromptKes(null);
    }
  };

  if (done) {
    return (
      <View style={[styles.screen, styles.success, { paddingBottom: bottom + spacing.xl }]}>
        <View style={styles.successBody}>
          <Animated.View
            entering={ZoomIn.springify().damping(14)}
            style={[styles.tick, { backgroundColor: plan.color }]}
          >
            <Check size={40} color="#FFFFFF" strokeWidth={2.6} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(150).duration(300)} style={styles.successText}>
            <AppText variant="title" align="center">
              {free ? 'You’re on Free' : `Welcome to ${plan.name}`}
            </AppText>
            <AppText variant="subhead" tone="secondary" align="center">
              {free ? 'Paid features have been turned off.' : `Active until ${renewalDate(period)}.`}
            </AppText>
          </Animated.View>
        </View>
        <Button label="Done" size="large" onPress={() => goBackOr('/profile')} style={styles.successButton} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Checkout" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.xl }]}>
        <View style={styles.planHead}>
          <View style={[styles.planDot, { backgroundColor: plan.color }]} />
          <AppText variant="largeTitle">{plan.name}</AppText>
          {!free && (
            <AppText variant="subhead" tone="secondary">
              {formatMoney(monthlyEquivalent)} a month
            </AppText>
          )}
        </View>

        {!free && (
          <View style={styles.toggleArea}>
            <View pointerEvents="none" style={[styles.toggleGlow, { backgroundColor: withAlpha(plan.color, 0.35) }]} />
            <PeriodToggle value={period} onChange={setPeriod} yearlyBadge={`-${Math.round(YEARLY_DISCOUNT * 100)}%`} />
          </View>
        )}

        {free ? (
          <AppText variant="body" tone="secondary">
            {account.planId === 'free'
              ? 'You’re on Free: 10 minutes of calls a day.'
              : `Plans don’t renew on their own. Your plan runs until ${
                  account.planEndsAt
                    ? new Date(account.planEndsAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'the end of the period'
                }, then you’re on Free.`}
          </AppText>
        ) : (
          <>
            <View>
              <Row label={`${plan.name} · ${period === 'monthly' ? 'Monthly' : 'Yearly'}`} value={formatMoney(total)} />
              <Separator />
              <Row label="Due today" value={formatMoney(total)} strong />
              <AppText variant="footnote" tone="secondary" style={styles.kes}>
                Charged as about {toKes(total)}
                {mpesa ? ' via M-Pesa' : ''}
              </AppText>
              <AppText variant="footnote" tone="secondary">
                Lasts until {renewalDate(period)}. Doesn’t renew automatically.
              </AppText>
            </View>

            <View style={styles.payment}>
              <AppText variant="footnote" tone="tertiary" style={styles.kicker}>
                PAY WITH
              </AppText>
              <Pressable
                onPress={() => setChoosingCard(true)}
                accessibilityRole="button"
                accessibilityLabel={`Pay with ${card ? methodLabel(card) : 'card'}. Change`}
              >
                {({ pressed }) => (
                  <View style={[styles.cardRow, pressed && styles.pressed]}>
                    <CardChip method={card ?? NEW_CARD_METHOD} />
                    <AppText variant="body" weight="500" style={styles.flex}>
                      {card ? methodLabel(card) : 'Card'}
                    </AppText>
                    <AppText variant="subhead" weight="600">
                      Change
                    </AppText>
                  </View>
                )}
              </Pressable>
              {account.paymentMethods.length === 0 && (
                <Pressable
                  onPress={() => router.push('/payment-methods/mpesa' as Href)}
                  accessibilityRole="link"
                  hitSlop={8}
                  style={({ pressed }) => [styles.addLink, pressed && styles.pressed]}
                >
                  <AppText variant="body" weight="600" align="center" style={styles.addLinkText}>
                    Pay with M-Pesa instead
                  </AppText>
                </Pressable>
              )}
            </View>
          </>
        )}

        <View style={styles.footer}>
          {processing && promptKes !== null && (
            <Animated.View entering={FadeIn.duration(250)} style={styles.prompt}>
              <AppText variant="subhead" weight="600" align="center">
                Check your phone
              </AppText>
              <AppText variant="footnote" tone="secondary" align="center">
                Enter your M-Pesa PIN to pay KES {promptKes.toLocaleString('en-KE')}.
              </AppText>
            </Animated.View>
          )}
          {error && !processing ? (
            <AppText variant="footnote" tone="danger" align="center">
              {error}
            </AppText>
          ) : null}
          <Button
            label={current ? 'Current plan' : free ? 'Got it' : `Pay ${formatMoney(total)}`}
            size="large"
            loading={processing}
            disabled={current || processing}
            onPress={free ? () => goBackOr('/plans') : pay}
          />
        </View>
      </ScrollView>

      <ActionSheet
        visible={choosingCard}
        title="Pay with"
        onClose={() => setChoosingCard(false)}
        actions={[
          ...account.paymentMethods.map((m) => ({
            label: methodLabel(m),
            selected: m.id === card?.id,
            onPress: () => setCardId(m.id),
          })),
          { label: 'New card', selected: !card, onPress: () => setCardId(NEW_CARD) },
          { label: 'Add M-Pesa', onPress: () => router.push('/payment-methods/mpesa') },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: {
    flexGrow: 1,
    paddingHorizontal: screenPadding,
    gap: spacing.xxl,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  planHead: { gap: 4, paddingTop: spacing.sm },
  planDot: { width: 14, height: 14, borderRadius: 7, marginBottom: spacing.sm },
  toggleArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  toggleGlow: { position: 'absolute', width: 170, height: 34, borderRadius: 17 },
  kes: { marginTop: -spacing.xs, marginBottom: 2 },
  prompt: { gap: 2, marginBottom: spacing.lg },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  amount: { fontVariant: ['tabular-nums'] },
  payment: { gap: spacing.xs },
  kicker: { letterSpacing: 0.6 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md },
  addLink: { alignSelf: 'center', paddingVertical: spacing.md },
  addLinkText: { textDecorationLine: 'underline' },
  pressed: { opacity: 0.5 },
  flex: { flex: 1 },
  footer: { marginTop: 'auto' },
  success: { paddingHorizontal: screenPadding },
  successBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xxl },
  tick: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  successText: { gap: spacing.sm, alignItems: 'center' },
  successButton: { width: '100%', maxWidth: 560, alignSelf: 'center' },
});
