import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View, type TextInputInstance } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SearchX, SlidersHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentCard } from '@/components/AgentCard';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { HeaderIconButton } from '@/components/HeaderIconButton';
import { HeaderSearch } from '@/components/HeaderSearch';
import { OptionSheet } from '@/components/OptionSheet';
import { Separator } from '@/components/Separator';
import { SkeletonRows } from '@/components/Skeleton';
import { agentCategories, searchAgents, type Agent } from '@/data/agents';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useActiveCall } from '@/state/ActiveCallContext';
import { colors, screenPadding, spacing } from '@/theme';

type Category = (typeof agentCategories)[number];

const GRID_BREAKPOINT = 640;
const MAX_CONTENT = 960;

export function ExploreScreen() {
  const { top } = useSafeAreaInsets();
  const bottomInset = useTabBarInset();
  const { width } = useWindowDimensions();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const { callAgent } = useActiveCall();
  // The agent catalogue ships with the app, so there's nothing to wait for.
  const loading = false;

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const searchRef = useRef<TextInputInstance>(null);
  const [searching, setSearching] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const columns = width >= GRID_BREAKPOINT ? 2 : 1;
  const results = useMemo(() => searchAgents(query, category), [query, category]);

  // Arriving from the Home search field focuses the input.
  useEffect(() => {
    if (focus === '1') {
      // Opening the bar mounts the input with autoFocus.
      const t = setTimeout(() => setSearching(true), 0);
      router.setParams({ focus: undefined });
      return () => clearTimeout(t);
    }
  }, [focus]);

  const open = (agent: Agent) => router.push({ pathname: '/agent/[id]', params: { id: agent.id } });

  const header = (
    <View style={styles.header}>
      <View style={styles.gutter}>
        <HeaderSearch
          title="AI contacts"
          open={searching}
          onOpenChange={setSearching}
          value={query}
          onChangeText={setQuery}
          placeholder="Search AI agents..."
          inputRef={searchRef}
          trailing={
            <View style={styles.filterButton}>
              <HeaderIconButton
                icon={SlidersHorizontal}
                accessibilityLabel={category === 'All' ? 'Filter' : `Filter: ${category}`}
                badge={category !== 'All'}
                onPress={() => setFilterOpen(true)}
              />
            </View>
          }
        />
        <AppText variant="footnote" tone="secondary" style={styles.count}>
          {loading
            ? ' '
            : `${category === 'All' ? '' : `${category} · `}${results.length} ${results.length === 1 ? 'agent' : 'agents'}`}
        </AppText>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: top + spacing.md }]}>
      <FlatList
        key={columns}
        data={loading ? [] : results}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset }}
        columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
        ItemSeparatorComponent={
          columns === 1
            ? () => (
                <View style={styles.gutter}>
                  <Separator inset={48 + spacing.md + 2} />
                </View>
              )
            : undefined
        }
        renderItem={({ item }) =>
          columns > 1 ? (
            <AgentCard agent={item} variant="tile" onPress={() => open(item)} onCall={() => callAgent(item.id)} />
          ) : (
            <View style={styles.gutter}>
              <AgentCard agent={item} onPress={() => open(item)} onCall={() => callAgent(item.id)} />
            </View>
          )
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.gutter}>
              <SkeletonRows count={5} />
            </View>
          ) : (
            <EmptyState
              icon={SearchX}
              title="No agents found"
              message={query ? `Nothing matches “${query.trim()}”` : `Nothing in ${category} yet`}
              actionLabel="Clear filters"
              onAction={() => {
                setQuery('');
                setCategory('All');
              }}
            />
          )
        }
      />
      <OptionSheet
        visible={filterOpen}
        title="Filter"
        options={agentCategories}
        value={category}
        onChange={setCategory}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  header: { width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center' },
  gutter: { paddingHorizontal: screenPadding, width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center' },
  subtitle: { marginTop: spacing.sm },
  filterButton: { marginRight: -10 },
  count: { marginTop: spacing.xl, marginBottom: spacing.xs },
  columnWrapper: {
    gap: spacing.md,
    paddingHorizontal: screenPadding,
    marginBottom: spacing.md,
    width: '100%',
    maxWidth: MAX_CONTENT,
    alignSelf: 'center',
  },
});
