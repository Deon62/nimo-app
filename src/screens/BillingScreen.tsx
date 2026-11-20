import { ScrollView, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { InsetGroup } from '@/components/InsetGroup';
import { ListRow } from '@/components/ListRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Toast, useToast } from '@/components/Toast';
import { UsageChart } from '@/components/UsageChart';
import { lastSevenDays, plans, usage } from '@/data/plans';
import { methodLabel, useAccount } from '@/state/AccountContext';
import { colors, screenPadding, spacing } from '@/theme';

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function BillingScreen() {
  const { bottom } = useSafeAreaInsets();
  const toast = useToast();
  const { planId, paymentMethods, defaultPaymentId } = useAccount();
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const card = paymentMethods.find((m) => m.id === defaultPaymentId);
  const week = lastSevenDays();
  const weekTotal = week.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Billing and usage" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.huge }]}>
        <View>
          <AppText variant="footnote" style={styles.kicker}>
            TODAY
          </AppText>
          <View style={styles.hero}>
            <AppText variant="largeTitle" style={styles.heroNumber}>
              {usage.usedTodayMinutes}
            </AppText>
            <AppText variant="body" tone="secondary">
              {' '}
              of {usage.dailyMinutes} min
            </AppText>
          </View>
        </View>

        <View style={styles.chartBlock}>
          <View style={styles.chartHeader}>
            <AppText variant="headline">Last 7 days</AppText>
            <AppText variant="subhead" tone="secondary">
              {weekTotal} min
            </AppText>
          </View>
          <UsageChart data={week} limit={usage.dailyMinutes} />
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <AppText variant="title">{formatMinutes(usage.monthMinutes)}</AppText>
            <AppText variant="footnote" tone="secondary">
              This month
            </AppText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <AppText variant="title">{usage.monthCalls}</AppText>
            <AppText variant="footnote" tone="secondary">
              Calls
            </AppText>
          </View>
        </View>

        <InsetGroup title="Billing">
          <ListRow type="link" label="Plan" value={plan.name} onPress={() => router.push('/plans')} />
          <ListRow
            type="link"
            label="Payment method"
            value={card ? methodLabel(card) : 'None'}
            onPress={() => router.push('/payment-methods' as Href)}
          />
          <ListRow type="value" label="Invoices" value="None yet" />
        </InsetGroup>
      </ScrollView>
      <Toast message={toast.message} bottom={bottom + spacing.xl} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.xxxl,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  kicker: { letterSpacing: 0.6, color: colors.text.tertiary },
  hero: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  heroNumber: { fontSize: 48, lineHeight: 54, fontVariant: ['tabular-nums'] },
  chartBlock: { gap: spacing.sm },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stat: { flex: 1, gap: 2 },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginRight: spacing.xl,
  },
});
