import { memo, useId, type ReactNode } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path } from 'react-native-svg';

import type { HairStyle, Portrait } from '@/data/agents';

/** Hair drawn behind the head (long styles, afro). */
function hairBack(style: HairStyle, c: string): ReactNode {
  switch (style) {
    case 'afro':
      return <Circle cx="50" cy="38" r="25" fill={c} />;
    case 'long':
      return <Path d="M32 44 C29 20 71 20 68 44 L71 82 C62 85 38 85 29 82 Z" fill={c} />;
    case 'wavy':
      return (
        <Path
          d="M32 44 C29 20 71 20 68 44 C72 52 66 58 71 66 C74 72 68 78 70 82 C60 86 40 86 30 82 C32 78 26 72 29 66 C34 58 28 52 32 44 Z"
          fill={c}
        />
      );
    case 'bob':
      return <Path d="M32 42 C30 20 70 20 68 42 L69 63 C60 66 40 66 31 63 Z" fill={c} />;
    case 'bun':
      return <Circle cx="50" cy="21" r="8.5" fill={c} />;
    default:
      return null;
  }
}

/** Hair drawn over the head (fringes and caps). */
function hairFront(style: HairStyle, c: string): ReactNode {
  switch (style) {
    case 'buzz':
      return <Path d="M35.5 40 C36 28 44 25.5 50 25.5 C57 25.5 64 28 64.5 40 C58 34 42 34 35.5 40 Z" fill={c} />;
    case 'short':
      return (
        <Path
          d="M34.5 43 C33 26 44 22 51 22 C60 22 67 28 65.5 43 C63 35 57 31.5 50 31.5 C43 31.5 38 35 34.5 43 Z"
          fill={c}
        />
      );
    case 'sidepart':
      return (
        <Path d="M34 45 C31 26 44 20.5 52 21.5 C63 23 69 31 66 45 C64 36 60 32 55 30.5 C48 35 40 36 34 45 Z" fill={c} />
      );
    case 'curly':
      return (
        <G fill={c}>
          <Circle cx="38" cy="33" r="7" />
          <Circle cx="45.5" cy="27" r="8" />
          <Circle cx="54.5" cy="27" r="8" />
          <Circle cx="62" cy="33" r="7" />
          <Circle cx="35.5" cy="40" r="4.5" />
          <Circle cx="64.5" cy="40" r="4.5" />
        </G>
      );
    case 'afro':
      return <Path d="M35 42 C36 30 44 27 50 27 C56 27 64 30 65 42 C60 36 40 36 35 42 Z" fill={c} />;
    case 'long':
    case 'bob':
    case 'bun':
      return (
        <Path d="M34.5 44 C33 26 44 23 50 23 C58 23 67 27 65.5 44 C62 34 55 31 50 32 C44 31 37 35 34.5 44 Z" fill={c} />
      );
    case 'wavy':
      return (
        <Path d="M34 46 C31 26 44 22 52 22.5 C62 23 69 31 66 46 C63 37 58 31 51 31 C46 35 39 37 34 46 Z" fill={c} />
      );
    default:
      return null;
  }
}

interface AgentPortraitProps {
  portrait: Portrait;
  background: string;
  size: number;
}

/** Flat, minimal illustrated bust used as each agent's avatar. */
export const AgentPortrait = memo(function AgentPortrait({ portrait: p, background, size }: AgentPortraitProps) {
  const clipId = `portrait${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx="50" cy="50" r="50" />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Circle cx="50" cy="50" r="50" fill={background} />
        {hairBack(p.hairStyle, p.hair)}
        <Path d="M44 56 h12 v14 a6 6 0 0 1 -12 0 Z" fill={p.skin} />
        <Path d="M44 60 h12 v4 C52 66 48 66 44 64 Z" fill="#000000" opacity={0.08} />
        <Path d="M13 104 C13 80 30 70.5 50 70.5 C70 70.5 87 80 87 104 Z" fill={p.outfit} />
        <Path d="M43 71 C45 76 55 76 57 71" fill="none" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth="1.5" />
        <Circle cx="35.5" cy="46" r="3.2" fill={p.skin} />
        <Circle cx="64.5" cy="46" r="3.2" fill={p.skin} />
        <Ellipse cx="50" cy="44" rx="15" ry="17.5" fill={p.skin} />
        {p.beard && (
          <Path
            d="M35.5 46 C36 61 43 66.5 50 66.5 C57 66.5 64 61 64.5 46 C61 55 56 57.5 50 57.5 C44 57.5 39 55 35.5 46 Z"
            fill={p.hair}
          />
        )}
        {hairFront(p.hairStyle, p.hair)}
        {p.glasses && (
          <G fill="none" stroke="#1C1C1E" strokeWidth="1.6">
            <Circle cx="43.5" cy="46" r="5" />
            <Circle cx="56.5" cy="46" r="5" />
            <Line x1="48.5" y1="46" x2="51.5" y2="46" />
          </G>
        )}
      </G>
    </Svg>
  );
});
