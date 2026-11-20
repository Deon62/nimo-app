import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { InsetGroup } from '@/components/InsetGroup';
import { ListRow } from '@/components/ListRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Toast, useToast } from '@/components/Toast';
import { settingsSections } from '@/data/settings';
import { colors, screenPadding, spacing } from '@/theme';

export function SettingsIndexScreen() {
  const { bottom } = useSafeAreaInsets();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const toast = useToast();

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.xxxl }]}>
        <InsetGroup separatorInset={24 + spacing.md}>
          {settingsSections
            .filter((section) => section.id !== 'account')
            .map((section) => (
              <ListRow
                key={section.id}
                type="link"
                icon={section.icon}
                label={section.title}
                onPress={() => router.push({ pathname: '/settings/[section]', params: { section: section.id } })}
              />
            ))}
        </InsetGroup>
        <InsetGroup>
          <ListRow type="link" icon={LogOut} label="Sign out" destructive onPress={() => setConfirmSignOut(true)} />
        </InsetGroup>
      </ScrollView>

      <Toast message={toast.message} bottom={bottom + spacing.xl} />
      <ConfirmSheet
        visible={confirmSignOut}
        title="Sign out of Nimo?"
        confirmLabel="Sign out"
        destructive
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          setConfirmSignOut(false);
          toast.show('Coming soon');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { paddingHorizontal: screenPadding, gap: spacing.xxl, width: '100%', maxWidth: 680, alignSelf: 'center' },
});
