import { StyleSheet } from 'react-native';
import { Phone } from 'lucide-react-native';

import type { Agent } from '@/data/agents';
import { colors, hitTarget } from '@/theme';
import { PressableScale } from './PressableScale';

interface CallIconButtonProps {
  agent: Pick<Agent, 'name' | 'availability'>;
  onPress: () => void;
}

/** Compact circular call affordance used in list rows. */
export function CallIconButton({ agent, onPress }: CallIconButtonProps) {
  const disabled = agent.availability === 'offline';
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityLabel={`Call ${agent.name}`}
      accessibilityState={{ disabled }}
      style={[styles.button, disabled && styles.disabled]}
      activeScale={0.92}
    >
      <Phone size={21} strokeWidth={1.8} color={disabled ? colors.text.tertiary : colors.ink} fill="none" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: hitTarget - 6,
    height: hitTarget - 6,
    borderRadius: (hitTarget - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
