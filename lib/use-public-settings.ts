'use client'

import { useEffect, useState } from 'react'
import { MOCK_SITE_SETTINGS } from './mock-data'
import type { SiteSettings } from './types'

type PublicSettingsResponse = {
  site_name_ko?: string
  tagline_ko?: string
  support_phone?: string
  support_email?: string
  company_name?: string
  company_address?: string
  operating_hours?: string
  min_order_vnd?: number | null
  contact_phone?: string
  contact_email?: string
  contact_address?: string
}

export function usePublicSettings() {
  const [settings, setSettings] = useState<SiteSettings>(MOCK_SITE_SETTINGS)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch('/api/settings', { method: 'GET' })
        const data = (await res.json()) as PublicSettingsResponse | { error?: string }
        if (cancelled || !res.ok || 'error' in data) return

        const minOrderFromApi =
          typeof data.min_order_vnd === 'number' && Number.isFinite(data.min_order_vnd)
            ? data.min_order_vnd
            : settings.min_order_vnd

        setSettings(prev => ({
          ...prev,
          site_name_ko: data.site_name_ko ?? prev.site_name_ko,
          tagline_ko: data.tagline_ko ?? prev.tagline_ko,
          contact_phone: (data.contact_phone ?? data.support_phone) ?? prev.contact_phone,
          contact_email: (data.contact_email ?? data.support_email) ?? prev.contact_email,
          contact_address: (data.contact_address ?? data.company_address) ?? prev.contact_address,
          operating_hours: data.operating_hours ?? prev.operating_hours,
          min_order_vnd: typeof minOrderFromApi === 'number' ? minOrderFromApi : prev.min_order_vnd,
        }))
      } catch {
        if (cancelled) return
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { settings }
}

