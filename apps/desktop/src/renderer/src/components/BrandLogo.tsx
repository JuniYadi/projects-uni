type Props = {
  size?: number
  variant?: 'neon' | 'idle' | 'solid-contrast'
  isDark?: boolean
  id?: string
}

export function BrandLogo({ size = 64, variant = 'neon', isDark = true, id }: Props) {
  const uid = id ?? `bl_${variant}_${isDark ? 'd' : 'l'}_${size}`

  let topColor = '#F8FAFC'
  let bottomColor = '#22C55E'
  let ghostColor = '#475569'

  if (variant === 'idle') {
    topColor = isDark ? '#94A3B8' : '#64748B'
    bottomColor = isDark ? '#64748B' : '#94A3B8'
    ghostColor = isDark ? '#334155' : '#CBD5E1'
  } else if (variant === 'solid-contrast') {
    topColor = '#FFFFFF'
    bottomColor = '#052E16'
    ghostColor = 'rgba(5, 46, 22, 0.45)'
  } else {
    // 'neon'
    topColor = isDark ? '#F8FAFC' : '#0F172A'
    bottomColor = isDark ? '#22C55E' : '#16A34A'
    ghostColor = isDark ? '#475569' : '#334155'
  }

  const ctId = `${uid}_ct`
  const cbId = `${uid}_cb`
  const rightId = `${uid}_right`

  const pinPath = 'M128 240C128 240 44 166 44 104A84 84 0 0 1 212 104C212 166 128 240 128 240Z'
  const pinWithKeyhole =
    'M128 240C128 240 44 166 44 104A84 84 0 0 1 212 104C212 166 128 240 128 240Z M108 172L117 111A22 22 0 1 1 139 111L148 172Z'

  return (
    <svg width={size} height={size} viewBox="0 0 256 256" style={{ display: 'block' }} aria-hidden="true">
      <defs>
        <clipPath id={ctId}>
          <path d="M-100 -100H400V96.8L-100 146.8Z" />
        </clipPath>
        <clipPath id={cbId}>
          <path d="M-100 154.8L400 104.8V400H-100Z" />
        </clipPath>
        <clipPath id={rightId}>
          <path d="M142 -100H400V400H128Z" />
        </clipPath>
      </defs>

      <g transform="translate(128, 128) scale(0.84) translate(-146, -128)">
        <g clipPath={`url(#${rightId})`}>
          <path
            d={pinPath}
            fill="none"
            stroke={ghostColor}
            strokeWidth={32}
            strokeLinejoin="round"
            opacity={0.4}
          />
        </g>
        <g clipPath={`url(#${ctId})`}>
          <path fill={topColor} fillRule="evenodd" d={pinWithKeyhole} />
        </g>
        <g clipPath={`url(#${cbId})`}>
          <g transform="translate(12.00, -1.20)">
            <path fill={bottomColor} fillRule="evenodd" d={pinWithKeyhole} />
          </g>
        </g>
      </g>
    </svg>
  )
}
