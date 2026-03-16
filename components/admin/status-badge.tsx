import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  new: {
    label: '신규',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  accepted: {
    label: '수락',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  preparing: {
    label: '준비중',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  out_for_delivery: {
    label: '배달중',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  completed: {
    label: '완료',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  canceled: {
    label: '취소',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
}

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

export const STATUS_LABELS: Record<OrderStatus, string> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])
) as Record<OrderStatus, string>
