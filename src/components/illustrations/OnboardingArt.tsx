import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { getAgent } from '@/data/agents';
import { AgentPortrait } from '../AgentPortrait';
import { blobPath, sparklePath } from './blob';
import { MascotArt } from './Mascot';

const VB_W = 300;
const VB_H = 260;
const INK = '#1F2340';

interface ArtProps {
  width: number;
}

const heightFor = (width: number) => (width * VB_H) / VB_W;

/** 1 — The mascot saying hello with a colourful voice bubble. */
export function TalkArt({ width }: ArtProps) {
  const id = `t${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const bars = [
    ['#7F9DF0', 14],
    ['#FF98B0', 24],
    ['#7DCB9E', 32],
    ['#F5C451', 22],
    ['#B79CF2', 12],
  ] as const;
  return (
    <Svg width={width} height={heightFor(width)} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <Path d={blobPath(150, 142, [112, 104, 118, 100, 110, 106, 116, 102], 0.3)} fill="#EEF3FF" />
      <G transform="translate(52 62) scale(0.86)">
        <MascotArt idPrefix={id} waving />
      </G>
      {/* speech bubble */}
      <G>
        <Rect x={186} y={30} width={96} height={58} rx={26} fill="#FFFFFF" stroke="#E2E8F7" strokeWidth={2} />
        <Circle cx={192} cy={98} r={5.5} fill="#FFFFFF" stroke="#E2E8F7" strokeWidth={2} />
        <Circle cx={183} cy={108} r={3.5} fill="#FFFFFF" stroke="#E2E8F7" strokeWidth={2} />
        {bars.map(([color, h], i) => (
          <Rect key={color} x={210 + i * 12} y={59 - h / 2} width={6} height={h} rx={3} fill={color} />
        ))}
      </G>
      <Path d={sparklePath(46, 66, 11)} fill="#F5C451" />
      <Path d={sparklePath(268, 196, 9)} fill="#FF98B0" />
      <Path d={sparklePath(40, 196, 6)} fill="#7F9DF0" />
      <Circle cx={262} cy={118} r={4} fill="#7DCB9E" />
      <Circle cx={84} cy={30} r={3} fill="#B79CF2" />
    </Svg>
  );
}

/** 2 — Three of the agents gathered together. */
export function VoicesArt({ width }: ArtProps) {
  const height = heightFor(width);
  const s = width / VB_W;
  const faces = [
    { id: 'maya', x: 46, y: 86, size: 92 },
    { id: 'nora', x: 162, y: 86, size: 92 },
    { id: 'alex', x: 92, y: 52, size: 116 },
  ];
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`} style={StyleSheet.absoluteFill}>
        <Path d={blobPath(150, 140, [108, 118, 102, 114, 106, 120, 100, 112], 0.1)} fill="#F5EFFC" />
        <Path
          d="M150 22 C150 14 160 10 166 16 C172 10 182 14 182 22 C182 32 166 40 166 40 C166 40 150 32 150 22Z"
          fill="#FF98B0"
          transform="translate(-16 0)"
        />
        <Path d={sparklePath(40, 60, 10)} fill="#F5C451" />
        <Path d={sparklePath(264, 64, 8)} fill="#7DCB9E" />
        <Path d={sparklePath(262, 210, 10)} fill="#B79CF2" />
        <Circle cx={36} cy={210} r={4} fill="#7F9DF0" />
        {/* little chat dots under the group */}
        <Rect x={112} y={202} width={76} height={30} rx={15} fill="#FFFFFF" stroke="#E9E0F6" strokeWidth={2} />
        <Circle cx={134} cy={217} r={4} fill="#B79CF2" />
        <Circle cx={150} cy={217} r={4} fill="#B79CF2" opacity={0.7} />
        <Circle cx={166} cy={217} r={4} fill="#B79CF2" opacity={0.4} />
      </Svg>
      {faces.map((f) => {
        const agent = getAgent(f.id);
        if (!agent) return null;
        const size = f.size * s;
        const ring = 4 * s;
        return (
          <View
            key={f.id}
            style={[
              styles.face,
              {
                left: f.x * s - ring,
                top: f.y * s - ring,
                padding: ring,
                borderRadius: size,
              },
            ]}
          >
            <AgentPortrait portrait={agent.portrait} background={agent.tone.background} size={size} />
          </View>
        );
      })}
    </View>
  );
}

/** 3 — A phone at night: Nimo is there whenever you need it. */
export function AnytimeArt({ width }: ArtProps) {
  const id = `a${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const bg = '#EAF6EF';
  return (
    <Svg width={width} height={heightFor(width)} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <Path d={blobPath(150, 140, [110, 102, 116, 104, 112, 100, 118, 106], 0.6)} fill={bg} />
      {/* moon */}
      <Circle cx={66} cy={74} r={24} fill="#F5C451" />
      <Circle cx={78} cy={66} r={21} fill={bg} />
      <Path d={sparklePath(104, 40, 7)} fill="#F5C451" />
      <Path d={sparklePath(246, 52, 10)} fill="#F5C451" />
      <Circle cx={226} cy={92} r={3} fill="#F5C451" />
      {/* cloud */}
      <G fill="#FFFFFF">
        <Ellipse cx={240} cy={196} rx={30} ry={14} />
        <Circle cx={228} cy={186} r={14} />
        <Circle cx={248} cy={180} r={17} />
      </G>
      {/* phone */}
      <Rect x={104} y={38} width={94} height={180} rx={24} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      <Rect x={136} y={48} width={30} height={7} rx={3.5} fill={INK} />
      <G transform="translate(117 72) scale(0.34)">
        <MascotArt idPrefix={id} />
      </G>
      {[10, 18, 26, 18, 10].map((h, i) => (
        <Rect key={i} x={129 + i * 9} y={160 - h / 2} width={5} height={h} rx={2.5} fill="#7DCB9E" />
      ))}
      <Circle cx={151} cy={196} r={11} fill="#7DCB9E" />
      <Path
        d="M146 193.5 q1.5 -2.5 3 -1 l1.2 1.6 q0.6 1 -0.4 1.8 q1 2.2 3.2 3.2 q0.8 -1 1.8 -0.4 l1.6 1.2 q1.5 1.5 -1 3 q-4 1 -7.6 -2.6 q-3.6 -3.6 -1.8 -6.8Z"
        fill="#FFFFFF"
      />
      <Path d={sparklePath(46, 186, 8)} fill="#7F9DF0" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  face: { position: 'absolute', backgroundColor: '#FFFFFF' },
});
