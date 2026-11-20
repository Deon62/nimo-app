import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';
import { AppText } from './AppText';
import { Separator } from './Separator';

interface InsetGroupProps {
  title?: string;
  footer?: string;
  children: ReactNode;
  /** Separator inset from the left edge of the group. */
  separatorInset?: number;
}

/** iOS-style grouped list section. */
export function InsetGroup({ title, footer, children, separatorInset = 0 }: InsetGroupProps) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.section}>
      {title && (
        <AppText variant="footnote" tone="secondary" style={styles.title}>
          {title.toUpperCase()}
        </AppText>
      )}
      <View style={styles.group}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 && <Separator inset={separatorInset} />}
            {child}
          </Fragment>
        ))}
      </View>
      {footer && (
        <AppText variant="footnote" tone="secondary" style={styles.footer}>
          {footer}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  title: { letterSpacing: 0.6, color: colors.text.tertiary },
  group: {},
  footer: { marginTop: 2 },
});
