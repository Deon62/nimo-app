import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { InsetGroup } from '@/components/InsetGroup';
import { ListRow } from '@/components/ListRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Toast, useToast } from '@/components/Toast';
import { UsageChart } from '@/components/UsageChart';
import { plans, toDailyUsage, type DailyUsage } from '@/data/plans';
import { api, errorMessage } from '@/lib/api';
import { methodLabel, useAccount } from '@/state/AccountContext';
import { colors, screenPadding, spacing } from '@/theme';

interface ApiUsage {
  daily_minutes: number | null;
  today_minutes: number;
  days: { date: string; minutes: number }[];
  month_minutes: number;
  month_calls: number;
}

interface Usage {
  today: number;
  /** Null on unlimited plans. */
  daily: number | null;
  week: DailyUsage[];
  monthMinutes: number;
  monthCalls: number;
}

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
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      api<ApiUsage>('/billing/usage')
        .then((u) => {
          if (!alive) return;
          setUsage({
            today: Math.round(u.today_minutes),
            daily: u.daily_minutes,
            week: toDailyUsage(u.days),
            monthMinutes: u.month_minutes,
            monthCalls: u.month_calls,
          });
          setError(null);
        })
        .catch((e) => alive && setError(errorMessage(e)));
      return () => {
        alive = false;
      };
    }, []),
  );

  const weekTotal = usage?.week.reduce((sum, d) => sum + d.minutes, 0) ?? 0;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Billing and usage" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.huge }]}>
        {!usage ? (
          error ? (
            <AppText variant="subhead" tone="secondary" align="center">
              {error}
            </AppText>
          ) : (
            <ActivityIndicator color={colors.ink} style={styles.spinner} />
          )
        ) : (
          <>
            <View>
              <AppText variant="footnote" style={styles.kicker}>
                TODAY
              </AppText>
              <View style={styles.hero}>
                <AppText variant="largeTitle" style={styles.heroNumber}>
                  {usage.today}
                </AppText>
                <AppText variant="body" tone="secondary">
                  {' '}
                  {usage.daily === null ? 'min · unlimited' : `of ${usage.daily} min`}
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
              <UsageChart data={usage.week} limit={usage.daily} />
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
          </>
        )}

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
  spinner: { marginVertical: spacing.huge },
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
