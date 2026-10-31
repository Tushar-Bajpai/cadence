import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-white/[0.08]',
        className
      )}
      {...props}
    />
  )
}

export function CardSkeletonGrid({
  count = 3,
}: {
  count?: number
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <div className="flex items-start justify-between">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({
  columns = 5,
  rows = 5,
}: {
  columns?: number
  rows?: number
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row} className="border-b border-white/5">
          {Array.from({ length: columns }, (_, column) => (
            <td key={column} className="px-6 py-4">
              <Skeleton className={cn('h-3', column === 0 ? 'w-24' : 'w-20')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
