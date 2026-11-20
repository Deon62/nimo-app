import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Check, Gem, Plus } from 'lucide-react-native';
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
import { methodLabel, useAccount, type BillingPeriod } from '@/state/AccountContext';
import { withAlpha } from '@/utils/color';
import { toKes } from '@/utils/mpesa';
import { colors, screenPadding, spacing } from '@/theme';

const PROCESSING_MS = 1400;
const MPESA_PROMPT_MS = 3500;

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
 * Plan checkout. Payment is simulated; when billing goes live, `pay` calls the
 * backend to create the subscription with the payment provider.
 */
export function CheckoutScreen() {
  const { plan: planParam } = useLocalSearchParams<{ plan: string }>();
  const { bottom } = useSafeAreaInsets();
  const account = useAccount();
  const plan = getPlan(planParam);
  const [period, setPeriod] = useState<BillingPeriod>(account.billingPeriod);
  const [cardId, setCardId] = useState<string | null>(null);
  const [choosingCard, setChoosingCard] = useState(false);
  const [processing, setProcessing] = useState(false);
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
  const card =
    account.paymentMethods.find((m) => m.id === (cardId ?? account.defaultPaymentId)) ?? account.paymentMethods[0];
  const total = priceFor(plan, period);
  const monthlyEquivalent = period === 'yearly' ? total / 12 : total;

  const mpesa = card?.kind === 'mpesa';

  // Simulated: a card charge, or an M-Pesa STK push that the user approves with their PIN.
  const pay = () => {
    setProcessing(true);
    setTimeout(
      () => {
        account.subscribe(plan.id, period);
        setProcessing(false);
        setDone(true);
      },
      mpesa ? MPESA_PROMPT_MS : PROCESSING_MS,
    );
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
              {free ? 'Paid features have been turned off.' : `Renews ${renewalDate(period)}.`}
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
            Switching to Free turns off call recording and limits calls to 10 minutes a day.
          </AppText>
        ) : (
          <>
            <View>
              <Row label={`${plan.name} · ${period === 'monthly' ? 'Monthly' : 'Yearly'}`} value={formatMoney(total)} />
              <Separator />
              <Row label="Due today" value={formatMoney(total)} strong />
              {mpesa && (
                <AppText variant="footnote" tone="secondary" style={styles.kes}>
                  About {toKes(total)} via M-Pesa
                </AppText>
              )}
              <AppText variant="footnote" tone="secondary">
                Renews {renewalDate(period)}. Cancel anytime.
              </AppText>
            </View>

            <View style={styles.payment}>
              <AppText variant="footnote" tone="tertiary" style={styles.kicker}>
                PAY WITH
              </AppText>
              {card ? (
                <Pressable
                  onPress={() => setChoosingCard(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Pay with ${methodLabel(card)}. Change`}
                >
                  {({ pressed }) => (
                    <View style={[styles.cardRow, pressed && styles.pressed]}>
                      <CardChip method={card} />
                      <AppText variant="body" weight="500" style={styles.flex}>
                        {methodLabel(card)}
                      </AppText>
                      <AppText variant="subhead" weight="600">
                        Change
                      </AppText>
                    </View>
                  )}
                </Pressable>
              ) : (
                <Pressable onPress={() => router.push('/payment-methods' as Href)} accessibilityRole="button">
                  {({ pressed }) => (
                    <View style={[styles.cardRow, pressed && styles.pressed]}>
                      <View style={styles.addIcon}>
                        <Plus size={18} color={colors.ink} strokeWidth={2} />
                      </View>
                      <AppText variant="body" weight="500" style={styles.flex}>
                        Add a card or M-Pesa
                      </AppText>
                    </View>
                  )}
                </Pressable>
              )}
            </View>
          </>
        )}

        <View style={styles.footer}>
          {processing && mpesa && (
            <Animated.View entering={FadeIn.duration(250)} style={styles.prompt}>
              <AppText variant="subhead" weight="600" align="center">
                Check your phone
              </AppText>
              <AppText variant="footnote" tone="secondary" align="center">
                Enter your M-Pesa PIN to pay {toKes(total)}.
              </AppText>
            </Animated.View>
          )}
          <Button
            label={current ? 'Current plan' : free ? 'Switch to Free' : `Pay ${formatMoney(total)}`}
            size="large"
            loading={processing}
            disabled={current || processing || (!free && !card)}
            onPress={free ? () => (account.subscribe('free', 'monthly'), setDone(true)) : pay}
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
          { label: 'Add a card', onPress: () => router.push('/payment-methods/add') },
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
  addIcon: {
    width: 44,
    height: 30,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.5 },
  flex: { flex: 1 },
  footer: { marginTop: 'auto' },
  success: { paddingHorizontal: screenPadding },
  successBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xxl },
  tick: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  successText: { gap: spacing.sm, alignItems: 'center' },
  successButton: { width: '100%', maxWidth: 560, alignSelf: 'center' },
});
