// Folder index routes are typed as "/x/index" by the route generator, but navigate as "/x".
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Camera, CreditCard, Gem, Settings, UserRound, Wallet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/AgentAvatar';
import { AppText } from '@/components/AppText';
import { HeaderIconButton } from '@/components/HeaderIconButton';
import { InsetGroup } from '@/components/InsetGroup';
import { ListRow } from '@/components/ListRow';
import { PressableScale } from '@/components/PressableScale';
import { getPlan } from '@/data/plans';
import { usePickPhoto } from '@/hooks/usePickPhoto';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useAccount } from '@/state/AccountContext';
import { colors, screenPadding, spacing } from '@/theme';

export function ProfileScreen() {
  const { top } = useSafeAreaInsets();
  const bottomInset = useTabBarInset();
  const { profile, setAvatar, planId, paymentMethods, defaultPaymentId } = useAccount();
  const pickPhoto = usePickPhoto();
  const plan = getPlan(planId);
  const defaultCard = paymentMethods.find((m) => m.id === defaultPaymentId);

  const changePhoto = async () => {
    const uri = await pickPhoto();
    if (uri) await setAvatar(uri).catch(() => {});
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top + spacing.md, paddingBottom: bottomInset }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <AppText variant="largeTitle" accessibilityRole="header">
            Profile
          </AppText>
          <HeaderIconButton
            icon={Settings}
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings' as Href)}
          />
        </View>

        <View style={styles.identity}>
          <PressableScale
            onPress={() => void changePhoto()}
            accessibilityLabel="Change profile photo"
            activeScale={0.95}
          >
            <UserAvatar name={profile.firstName} uri={profile.avatarUri} size={104} />
            <View style={styles.cameraBadge}>
              <Camera size={15} color="#FFFFFF" strokeWidth={2} />
            </View>
          </PressableScale>
          <AppText variant="title" align="center" style={styles.name}>
            {profile.firstName} {profile.lastName}
          </AppText>
          <AppText variant="subhead" tone="secondary" align="center">
            {profile.email}
          </AppText>
        </View>

        <InsetGroup separatorInset={24 + spacing.md}>
          <ListRow type="link" icon={UserRound} label="Account details" onPress={() => router.push('/profile/edit')} />
          <ListRow type="link" icon={Gem} label="Plan" value={plan?.name} onPress={() => router.push('/plans')} />
          <ListRow type="link" icon={CreditCard} label="Billing and usage" onPress={() => router.push('/billing')} />
          <ListRow
            type="link"
            icon={Wallet}
            label="Payment methods"
            value={defaultCard ? (defaultCard.kind === 'card' ? `•••• ${defaultCard.last4}` : 'M-Pesa') : undefined}
            onPress={() => router.push('/payment-methods' as Href)}
          />
        </InsetGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingHorizontal: screenPadding, gap: spacing.xxl, width: '100%', maxWidth: 680, alignSelf: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: -10 },
  identity: { alignItems: 'center', paddingVertical: spacing.sm },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ink,
    borderWidth: 3,
    borderColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { marginTop: spacing.lg },
});
