'use client'

interface ProfileAvatarProps {
  name?: string | null
  size?: 'sm' | 'md'
}

function getInitials(name?: string | null): string {
  const words = name?.trim().split(/\s+/).filter(Boolean) || []
  if (words.length === 0) return 'U'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

export function ProfileAvatar({ name, size = 'md' }: ProfileAvatarProps) {
  const dimensions = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-sm'

  return (
    <span
      aria-hidden="true"
      className={`${dimensions} inline-flex items-center justify-center rounded-full bg-[#8978ff] text-white font-bold shadow-[0_2px_12px_rgba(137,120,255,0.3)] ring-1 ring-white/15`}
    >
      {getInitials(name)}
    </span>
  )
}
