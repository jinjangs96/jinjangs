'use client'

import { Phone, MessageCircle } from 'lucide-react'
import { MOCK_FLOATING_ICONS } from '@/lib/mock-data'

const ICON_MAP = {
  zalo: MessageCircle,
  phone: Phone,
  kakao: MessageCircle,
  custom: MessageCircle,
} as const

export function FloatingIcons() {
  const activeIcons = MOCK_FLOATING_ICONS.filter(icon => icon.is_active).sort((a, b) => a.sort_order - b.sort_order)

  if (activeIcons.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {activeIcons.map((icon) => {
        const Icon = ICON_MAP[icon.type]
        const bgColor = icon.type === 'zalo' ? 'bg-blue-500 hover:bg-blue-600' :
                        icon.type === 'phone' ? 'bg-ok hover:bg-ok/90' :
                        icon.type === 'kakao' ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' :
                        'bg-primary hover:bg-primary/90'

        return (
          <a
            key={icon.id}
            href={icon.url}
            target={icon.url.startsWith('tel:') ? undefined : '_blank'}
            rel={icon.url.startsWith('tel:') ? undefined : 'noopener noreferrer'}
            className={`group flex items-center gap-2 w-12 h-12 rounded-full ${bgColor} text-white shadow-lg transition-all duration-300 hover:w-auto hover:px-4 overflow-hidden`}
            aria-label={icon.label_ko}
          >
            <Icon className="w-5 h-5 shrink-0 ml-3.5 group-hover:ml-0" />
            <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pr-1">
              {icon.label_ko}
            </span>
          </a>
        )
      })}
    </div>
  )
}
