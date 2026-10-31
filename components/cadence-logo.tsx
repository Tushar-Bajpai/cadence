import React from 'react'

interface CadenceLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function CadenceLogo({ className = 'size-8', ...props }: CadenceLogoProps) {
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
        <linearGradient id="cadenceSimpleGrad" x1="280" y1="140" x2="160" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#d5ccff" />
          <stop offset="70%" stopColor="#8978ff" />
          <stop offset="100%" stopColor="#5e42f0" />
        </linearGradient>
      </defs>

      {/* Dark Obsidian Squircle Tile */}
      <rect x="24" y="24" width="464" height="464" rx="116" fill="#080625" />
      <rect x="24" y="24" width="464" height="464" rx="116" stroke="rgba(137,120,255,0.28)" strokeWidth="4" />

      {/* Pure Minimalist Cadence "C" Arc */}
      <path
        d="M 371 171 A 132 132 0 1 0 371 341"
        stroke="url(#cadenceSimpleGrad)"
        strokeWidth="50"
        strokeLinecap="round"
      />
    </svg>
  )
}
