'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_ORDER_STATUS_LABELS, getAdminLabel } from '@/lib/admin-i18n'

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { locale } = useAdminLocale()
  const STATUS_CONFIG = useMemo(
    (): Record<OrderStatus, { label: string; className: string }> => ({
      new: {
        label: getAdminLabel(locale, ADMIN_ORDER_STATUS_LABELS, 'new'),
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      accepted: {
        label: getAdminLabel(locale, ADMIN_ORDER_STATUS_LABELS, 'accepted'),
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      preparing: {
        label: getAdminLabel(locale, ADMIN_ORDER_STATUS_LABELS, 'preparing'),
        className: 'bg-orange-50 text-orange-700 border-orange-200',
      },
      out_for_delivery: {
        label: getAdminLabel(locale, ADMIN_ORDER_STATUS_LABELS, 'out_for_delivery'),
        className: 'bg-purple-50 text-purple-700 border-purple-200',
      },
      completed: {
        label: getAdminLabel(locale, ADMIN_ORDER_STATUS_LABELS, 'completed'),
        className: 'bg-green-50 text-green-700 border-green-200',
      },
      canceled: {
        label: getAdminLabel(locale, ADMIN_ORDER_STATUS_LABELS, 'canceled'),
        className: 'bg-red-50 text-red-700 border-red-200',
      },
    }),
    [locale]
  )
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
