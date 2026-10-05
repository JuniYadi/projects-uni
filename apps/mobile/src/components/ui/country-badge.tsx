import { Text, View } from 'react-native';
import Svg, { Circle, G, Path, Polygon, Rect } from 'react-native-svg';
import { Figtree } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HK_PETAL_WHITE =
  'M449.964 299.913c-105.263-44.486-58.602-181.581 42.07-174.69-20.366 10.467-23.318 29.997-11.687 48.09 13.024 20.256-1.2 52.848-18.806 60.767-28.935 13.025-34.728 47.75-11.577 65.833z';
const HK_PETAL_RED =
  'M444.272 200.92l-5.92 9.294-2.144-10.815-10.679-2.759 9.625-5.39-.671-10.999 8.085 7.49 10.256-4.043-4.61 10.01 7.001 8.505zm6.288 97.839c-12.731-6.534-22.996-20.155-27.468-36.431-5.115-18.67-2.173-38.743 8.083-55.038l-2.208-1.394c-10.64 16.929-13.693 37.743-8.386 57.12 4.728 17.221 15.214 31.097 28.787 38.064z';

function FlagSvg({ code, size }: { code: string; size: number }) {
  switch (code) {
    case 'ID':
      return (
        <Svg width={size} height={size} viewBox="0 0 36 36">
          <Rect width={36} height={18} fill="#E11D48" />
          <Rect y={18} width={36} height={18} fill="#FFFFFF" />
        </Svg>
      );
    case 'JP':
      return (
        <Svg width={size} height={size} viewBox="0 0 36 36">
          <Rect width={36} height={36} fill="#FFFFFF" />
          <Circle cx={18} cy={18} r={7.5} fill="#BC002D" />
        </Svg>
      );
    case 'SG':
      return (
        <Svg width={size} height={size} viewBox="0 0 36 36">
          <Rect width={36} height={18} fill="#E11D48" />
          <Rect y={18} width={36} height={18} fill="#FFFFFF" />
          <Path d="M 11 3.8 A 5.2 5.2 0 1 0 11 14.2 A 4.3 4.3 0 1 1 11 3.8 Z" fill="#FFFFFF" />
          <Polygon points="16.00,5.40 16.27,5.94 16.86,6.03 16.43,6.45 16.53,7.04 16.00,6.76 15.47,7.04 15.57,6.45 15.14,6.03 15.73,5.94" fill="#FFFFFF" />
          <Polygon points="18.57,7.27 18.84,7.81 19.43,7.89 19.00,8.32 19.10,8.91 18.57,8.63 18.04,8.91 18.14,8.32 17.71,7.89 18.30,7.81" fill="#FFFFFF" />
          <Polygon points="17.59,10.29 17.86,10.82 18.45,10.91 18.02,11.34 18.12,11.93 17.59,11.65 17.06,11.93 17.16,11.34 16.73,10.91 17.32,10.82" fill="#FFFFFF" />
          <Polygon points="14.41,10.29 14.68,10.82 15.27,10.91 14.84,11.34 14.94,11.93 14.41,11.65 13.88,11.93 13.98,11.34 13.55,10.91 14.14,10.82" fill="#FFFFFF" />
          <Polygon points="13.43,7.27 13.70,7.81 14.29,7.89 13.86,8.32 13.96,8.91 13.43,8.63 12.90,8.91 13.00,8.32 12.57,7.89 13.16,7.81" fill="#FFFFFF" />
        </Svg>
      );
    case 'HK':
      return (
        <Svg width={size} height={size} viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice">
          <Rect width={900} height={600} fill="#EE1C25" />
          {[0, 72, 144, 216, 288].map((angle) => (
            <G key={angle} transform={`rotate(${angle} 450 300)`}>
              <Path d={HK_PETAL_WHITE} fill="#FFFFFF" />
              <Path d={HK_PETAL_RED} fill="#EE1C25" />
            </G>
          ))}
        </Svg>
      );
    case 'US':
      return (
        <Svg width={size} height={size} viewBox="0 0 36 36">
          <Rect width={36} height={36} fill="#FFFFFF" />
          <Rect y={0} width={36} height={2.77} fill="#B22234" />
          <Rect y={5.54} width={36} height={2.77} fill="#B22234" />
          <Rect y={11.08} width={36} height={2.77} fill="#B22234" />
          <Rect y={16.62} width={36} height={2.77} fill="#B22234" />
          <Rect y={22.15} width={36} height={2.77} fill="#B22234" />
          <Rect y={27.69} width={36} height={2.77} fill="#B22234" />
          <Rect y={33.23} width={36} height={2.77} fill="#B22234" />
          <Rect width={16} height={19.4} fill="#3C3B6E" />
          <Circle cx={3.5} cy={3.5} r={0.8} fill="#FFFFFF" />
          <Circle cx={8} cy={3.5} r={0.8} fill="#FFFFFF" />
          <Circle cx={12.5} cy={3.5} r={0.8} fill="#FFFFFF" />
          <Circle cx={5.7} cy={7} r={0.8} fill="#FFFFFF" />
          <Circle cx={10.2} cy={7} r={0.8} fill="#FFFFFF" />
          <Circle cx={3.5} cy={10.5} r={0.8} fill="#FFFFFF" />
          <Circle cx={8} cy={10.5} r={0.8} fill="#FFFFFF" />
          <Circle cx={12.5} cy={10.5} r={0.8} fill="#FFFFFF" />
          <Circle cx={5.7} cy={14} r={0.8} fill="#FFFFFF" />
          <Circle cx={10.2} cy={14} r={0.8} fill="#FFFFFF" />
          <Circle cx={3.5} cy={17.5} r={0.8} fill="#FFFFFF" />
          <Circle cx={8} cy={17.5} r={0.8} fill="#FFFFFF" />
          <Circle cx={12.5} cy={17.5} r={0.8} fill="#FFFFFF" />
        </Svg>
      );
    default:
      return null;
  }
}

/** Circular country badge with SVG flag, falls back to country code text. */
export function CountryBadge({ code, size = 36 }: { code: string; size?: number }) {
  const theme = useTheme();
  const upper = code ? code.toUpperCase() : '';
  const flag = FlagSvg({ code: upper, size });

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        backgroundColor: theme.backgroundSelected,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {flag ?? (
        <Text style={{ fontFamily: Figtree.semibold, fontSize: Math.round(size * 0.34), color: theme.textSecondary }}>
          {upper}
        </Text>
      )}
    </View>
  );
}
