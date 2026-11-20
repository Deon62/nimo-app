import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmSheet } from '@/components/ConfirmSheet';
import { EmptyState } from '@/components/EmptyState';
import { InsetGroup } from '@/components/InsetGroup';
import { ListRow } from '@/components/ListRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Toast, useToast } from '@/components/Toast';
import { getSettingsSection, type SettingsItem, type SettingsSectionId } from '@/data/settings';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/state/AuthContext';
import { useCallHistory } from '@/state/CallHistoryContext';
import { usePreferences } from '@/state/PreferencesContext';
import { colors, screenPadding, spacing } from '@/theme';

export function SettingsScreen() {
  const { section: sectionId } = useLocalSearchParams<{ section: SettingsSectionId }>();
  const { bottom } = useSafeAreaInsets();
  const section = getSettingsSection(sectionId);
  const prefs = usePreferences();
  const { clearHistory } = useCallHistory();
  const toast = useToast();
  const { signOut } = useAuth();
  const [confirm, setConfirm] = useState<'history' | 'account' | null>(null);

  if (!section) {
    return (
      <View style={styles.screen}>
        <ScreenHeader backLabel="Profile" />
        <EmptyState icon={Settings} title="Setting not found" message="This section doesn’t exist." />
      </View>
    );
  }

  const key = (item: SettingsItem) => `${section.id}.${item.id}`;

  const onLink = (item: Extract<SettingsItem, { kind: 'link' }>) => {
    if (item.id === 'delete') {
      setConfirm('history');
      return;
    }
    if (item.id === 'delete-account') {
      setConfirm('account');
      return;
    }
    toast.show('Coming soon');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader backLabel="Profile" title={section.title} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + spacing.huge }]}>
        {section.groups.map((group, gi) => {
          const simple = group.items.filter((i) => i.kind !== 'choice');
          const choices = group.items.filter(
            (i): i is Extract<SettingsItem, { kind: 'choice' }> => i.kind === 'choice',
          );
          return (
            <View key={gi} style={styles.groupStack}>
              {simple.length > 0 && (
                <InsetGroup title={group.title} footer={choices.length === 0 ? group.footer : undefined}>
                  {simple.map((item) => {
                    switch (item.kind) {
                      case 'toggle':
                        return (
                          <ListRow
                            key={item.id}
                            type="toggle"
                            label={item.label}
                            detail={item.detail}
                            value={prefs.get(key(item), item.defaultValue)}
                            onValueChange={(v) => prefs.set(key(item), v)}
                          />
                        );
                      case 'info':
                        return <ListRow key={item.id} type="value" label={item.label} value={item.value} />;
                      case 'link':
                        return (
                          <ListRow
                            key={item.id}
                            type="link"
                            label={item.label}
                            detail={item.detail}
                            destructive={item.destructive}
                            onPress={() => onLink(item)}
                          />
                        );
                      default:
                        return null;
                    }
                  })}
                </InsetGroup>
              )}
              {choices.map((item, ci) => (
                <InsetGroup
                  key={item.id}
                  title={simple.length === 0 && ci === 0 && group.title ? `${group.title} · ${item.label}` : item.label}
                  footer={ci === choices.length - 1 ? group.footer : undefined}
                >
                  {item.options.map((option) => (
                    <ListRow
                      key={option}
                      type="check"
                      label={option}
                      checked={prefs.get(key(item), item.defaultValue) === option}
                      onPress={() => prefs.set(key(item), option)}
                    />
                  ))}
                </InsetGroup>
              ))}
            </View>
          );
        })}
      </ScrollView>
      <Toast message={toast.message} bottom={bottom + spacing.xl} />
      <ConfirmSheet
        visible={confirm !== null}
        title={confirm === 'account' ? 'Delete your account?' : 'Delete all calls?'}
        message={
          confirm === 'account'
            ? 'Your profile, calls and recordings are removed for good. This can’t be undone.'
            : 'Transcripts and recordings are removed for good.'
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const what = confirm;
          setConfirm(null);
          try {
            if (what === 'account') {
              await api('/me', { method: 'DELETE' });
              await signOut();
            } else {
              await clearHistory();
              toast.show('Call history deleted');
            }
          } catch (e) {
            toast.show(errorMessage(e));
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.xxl + 4,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  groupStack: { gap: spacing.xxl + 4 },
});
