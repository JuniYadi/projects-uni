import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';

type Props = {
  size?: number;
  /**
   * - 'neon': Active connected state (white top + green bottom + ghost shadow)
   * - 'idle': Muted monochrome state
   * - 'solid-contrast': White top + deep forest green bottom for inside solid green buttons
   */
  variant?: 'neon' | 'idle' | 'solid-contrast';
  isDark?: boolean;
};


export function BrandLogo({ size = 64, variant = 'neon', isDark = true }: Props) {
  // Unique IDs for SVG defs to avoid collisions when multiple instances are mounted
  const idPrefix = `bl_${variant}_${isDark ? 'd' : 'l'}`;

  let topColor = '#F8FAFC';
  let bottomColor = '#22C55E';
  let ghostColor = '#475569';

  if (variant === 'idle') {
    topColor = isDark ? '#94A3B8' : '#64748B';
    bottomColor = isDark ? '#64748B' : '#94A3B8';
    ghostColor = isDark ? '#334155' : '#CBD5E1';
  } else if (variant === 'solid-contrast') {
    topColor = '#FFFFFF';
    bottomColor = '#052E16';
    ghostColor = 'rgba(5, 46, 22, 0.45)';
  } else {
    // 'neon'
    topColor = isDark ? '#F8FAFC' : '#0F172A';
    bottomColor = isDark ? '#22C55E' : '#16A34A';
    ghostColor = isDark ? '#475569' : '#334155';
  }

  const ctId = `${idPrefix}_ct`;
  const cbId = `${idPrefix}_cb`;
  const rightId = `${idPrefix}_right`;

  const pinPath =
    'M128 240C128 240 44 166 44 104A84 84 0 0 1 212 104C212 166 128 240 128 240Z';
  const pinWithKeyhole =
    'M128 240C128 240 44 166 44 104A84 84 0 0 1 212 104C212 166 128 240 128 240Z M108 172L117 111A22 22 0 1 1 139 111L148 172Z';

  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Defs>
        <ClipPath id={ctId}>
          <Path d="M-100 -100H400V96.8L-100 146.8Z" />
        </ClipPath>
        <ClipPath id={cbId}>
          <Path d="M-100 154.8L400 104.8V400H-100Z" />
        </ClipPath>
        <ClipPath id={rightId}>
          <Path d="M142 -100H400V400H128Z" />
        </ClipPath>
      </Defs>

      <G transform="translate(128, 128) scale(0.84) translate(-146, -128)">
        <G clipPath={`url(#${rightId})`}>
          <Path
            d={pinPath}
            fill="none"
            stroke={ghostColor}
            strokeWidth={32}
            strokeLinejoin="round"
            opacity={0.4}
          />
        </G>
        <G clipPath={`url(#${ctId})`}>
          <Path fill={topColor} fillRule="evenodd" d={pinWithKeyhole} />
        </G>
        <G clipPath={`url(#${cbId})`}>
          <G transform="translate(12.00, -1.20)">
            <Path fill={bottomColor} fillRule="evenodd" d={pinWithKeyhole} />
          </G>
        </G>
      </G>
    </Svg>
  );
}
