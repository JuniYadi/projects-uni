import type { ReactNode } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'locations'
  | 'settings'
  | 'shield'
  | 'shield-check'
  | 'power'
  | 'alert'
  | 'star'
  | 'check'
  | 'chevron-right'
  | 'chevron-left'
  | 'close'
  | 'plus'
  | 'key'
  | 'qr'
  | 'external-link'
  | 'search'
  | 'refresh'
  | 'info';

interface IconProps {
  name: IconName;
  color: string;
  size?: number;
  filled?: boolean;
  strokeWidth?: number;
}

export function Icon({
  name,
  color,
  size = 24,
  filled = false,
  strokeWidth = 1.8,
}: IconProps) {
  const strokeProps = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  let content: ReactNode = null;
  switch (name) {
    case 'home':
      content = <Path d="M4 11l8-7 8 7v9H4z" fill={filled ? color : 'none'} {...strokeProps} />;
      break;
    case 'locations':
      content = (
        <>
          <Circle cx="12" cy="12" r="9" fill={filled ? color : 'none'} {...strokeProps} />
          <Path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" fill="none" {...strokeProps} />
        </>
      );
      break;
    case 'settings':
      content = (
        <>
          <Circle cx="12" cy="12" r="3" fill={filled ? color : 'none'} {...strokeProps} />
          <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" fill="none" {...strokeProps} />
        </>
      );
      break;
    case 'shield':
      content = <Path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" fill={filled ? color : 'none'} {...strokeProps} />;
      break;
    case 'shield-check':
      content = (
        <>
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={filled ? color : 'none'} {...strokeProps} />
          <Path d="m9 12 2 2 4-4" fill="none" {...strokeProps} />
        </>
      );
      break;
    case 'power':
      content = (
        <>
          <Path d="M12 3v8" fill="none" {...strokeProps} />
          <Path d="M6.3 6.8a8 8 0 1 0 11.4 0" fill="none" {...strokeProps} />
        </>
      );
      break;
    case 'alert':
      content = (
        <>
          <Path d="M12 4l9 16H3z" fill={filled ? color : 'none'} {...strokeProps} />
          <Path d="M12 10v4M12 17.5v.01" fill="none" {...strokeProps} />
        </>
      );
      break;
    case 'info':
      content = (
        <>
          <Circle cx="12" cy="12" r="10" fill={filled ? color : 'none'} {...strokeProps} />
          <Path d="M12 16v-4M12 8h.01" fill="none" {...strokeProps} />
        </>
      );
      break;
    case 'star':
      content = (
        <Path
          d="M12 3.5l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.9l6-.9z"
          fill={filled ? color : 'none'}
          {...strokeProps}
        />
      );
      break;
    case 'check':
      content = <Path d="M5 12l5 5 9-10" fill="none" {...strokeProps} />;
      break;
    case 'chevron-right':
      content = <Path d="M9 6l6 6-6 6" fill="none" {...strokeProps} />;
      break;
    case 'chevron-left':
      content = <Path d="M15 6l-6 6 6 6" fill="none" {...strokeProps} />;
      break;
    case 'close':
      content = <Path d="M6 6l12 12M18 6L6 18" fill="none" {...strokeProps} />;
      break;
    case 'plus':
      content = <Path d="M12 5v14M5 12h14" fill="none" {...strokeProps} />;
      break;
    case 'key':
      content = <Path d="M14 10a4 4 0 1 1 3 3.9L9 22H6v-3l2-2h2v-2l3-3" fill={filled ? color : 'none'} {...strokeProps} />;
      break;
    case 'qr':
      content = (
        <Path
          d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8"
          fill="none"
          {...strokeProps}
        />
      );
      break;
    case 'external-link':
      content = (
        <Path
          d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
          fill="none"
          {...strokeProps}
        />
      );
      break;
    case 'search':
      content = (
        <>
          <Circle cx="11" cy="11" r="7" fill="none" {...strokeProps} />
          <Path d="M21 21l-5-5" fill="none" {...strokeProps} />
        </>
      );
      break;
    case 'refresh':
      content = (
        <Path
          d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
          fill="none"
          {...strokeProps}
        />
      );
      break;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {content}
    </Svg>
  );
}
