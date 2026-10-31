import React from 'react'

interface CadenceLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  glow?: boolean
}

export function CadenceLogo({ className = 'size-8', glow = true, ...props }: CadenceLogoProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Cadence Logo"
      {...props}
    >
      <defs>
        {/* Deep Cosmic Background */}
        <linearGradient id="cadenceLogoBg" x1="48" y1="24" x2="464" y2="488" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#140f3c" />
          <stop offset="45%" stopColor="#090624" />
          <stop offset="100%" stopColor="#030210" />
        </linearGradient>

        {/* Ambient Core Lighting */}
        <radialGradient id="cadenceLogoCore" cx="48%" cy="46%" r="56%">
          <stop offset="0%" stopColor="#8978ff" stopOpacity="0.4" />
          <stop offset="55%" stopColor="#6042ec" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8978ff" stopOpacity="0" />
        </radialGradient>

        {/* Glass Rim Stroke */}
        <linearGradient id="cadenceLogoRim" x1="32" y1="32" x2="480" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#b8aaff" stopOpacity="0.8" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6d50f7" stopOpacity="0.45" />
        </linearGradient>

        {/* Sculpted Cadence "C" Ribbon */}
        <linearGradient id="cadenceLogoRibbon" x1="130" y1="110" x2="380" y2="410" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="16%" stopColor="#e0d7ff" />
          <stop offset="45%" stopColor="#9d8cff" />
          <stop offset="78%" stopColor="#6d50f7" />
          <stop offset="100%" stopColor="#462cc7" />
        </linearGradient>

        {/* Top Glint */}
        <linearGradient id="cadenceLogoGlint" x1="200" y1="95" x2="330" y2="155" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Pulse Spark Gradients */}
        <linearGradient id="cadenceLogoSpark" x1="0" y1="-45" x2="0" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#f0ecff" />
          <stop offset="80%" stopColor="#b1a0ff" />
          <stop offset="100%" stopColor="#8978ff" />
        </linearGradient>

        <radialGradient id="cadenceLogoHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a79aff" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#7659ff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7659ff" stopOpacity="0" />
        </radialGradient>

        {/* Glow Filter */}
        {glow && (
          <filter id="cadenceLogoShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="18" floodColor="#583df2" floodOpacity="0.45" />
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.7" />
          </filter>
        )}
      </defs>

      {/* App Squircle Tile Base */}
      <rect x="16" y="16" width="480" height="480" rx="114" fill="url(#cadenceLogoBg)" />
      <rect x="16" y="16" width="480" height="480" rx="114" fill="url(#cadenceLogoCore)" />
      <rect x="16" y="16" width="480" height="480" rx="114" stroke="url(#cadenceLogoRim)" strokeWidth="8" />

      {/* Inner Subtle Glass Lip */}
      <rect x="24" y="24" width="464" height="232" rx="106" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />

      {/* Monogram Group */}
      <g filter={glow ? 'url(#cadenceLogoShadow)' : undefined}>
        {/* Sculpted Cadence "C" Ribbon */}
        <path
          d="M 345 125 A 158.37 158.37 0 1 0 345 387 A 30 30 0 0 0 345 327 A 113.85 113.85 0 1 1 345 185 A 30 30 0 0 0 345 125 Z"
          fill="url(#cadenceLogoRibbon)"
        />

        {/* Specular Crest Highlight Along Upper Shoulder */}
        <path
          d="M 335 132 A 154 154 0 0 0 205 130"
          stroke="url(#cadenceLogoGlint)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cadence Rhythmic Pulse Spark */}
        <g transform="translate(306, 256)">
          <circle cx="0" cy="0" r="54" fill="url(#cadenceLogoHalo)" />
          <path
            d="M 0 -44 Q 0 0, 44 0 Q 0 0, 0 44 Q 0 0, -44 0 Q 0 0, 0 -44 Z"
            fill="url(#cadenceLogoSpark)"
          />
          <circle cx="0" cy="0" r="8" fill="#ffffff" />
          <circle cx="0" cy="0" r="14" fill="#ffffff" opacity="0.35" />
        </g>
      </g>
    </svg>
  )
}

