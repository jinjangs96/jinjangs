'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_DELIVERY_ZONES_LABELS, ADMIN_COMMON_LABELS, getAdminLabel } from '@/lib/admin-i18n'

type Zone = Record<string, unknown>

export default function AdminDeliveryZonesPage() {
  const { locale } = useAdminLocale()
  const [zones, setZones] = useState<Zone[]>([])
  const [newZoneName, setNewZoneName] = useState('')
  const [newDistrict, setNewDistrict] = useState('')

  const loadZones = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token ?? ''
    const response = await fetch('/api/admin/delivery-zones', { headers: { Authorization: `Bearer ${token}` } })
    const result = (await response.json()) as { error?: string; zones?: Zone[] }
    if (!response.ok) {
      toast.error(result.error || getAdminLabel(locale, ADMIN_DELIVERY_ZONES_LABELS, 'load_failed'))
      return
    }
    setZones(result.zones ?? [])
  }

  useEffect(() => {
    loadZones().catch(() => null)
  }, [])

  const saveZone = async () => {
    if (!newZoneName.trim() || !newDistrict.trim()) {
      toast.error(getAdminLabel(locale, ADMIN_DELIVERY_ZONES_LABELS, 'required_error'))
      return
    }
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token ?? ''
    const response = await fetch('/api/admin/delivery-zones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        zone_name: newZoneName,
        district: newDistrict,
        is_active: true,
      }),
    })
    const result = (await response.json()) as { error?: string }
    if (!response.ok) {
      toast.error(result.error || getAdminLabel(locale, ADMIN_DELIVERY_ZONES_LABELS, 'save_failed'))
      return
    }
    toast.success(getAdminLabel(locale, ADMIN_DELIVERY_ZONES_LABELS, 'save_success'))
    setNewZoneName('')
    setNewDistrict('')
    await loadZones()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader><CardTitle>{getAdminLabel(locale, ADMIN_DELIVERY_ZONES_LABELS, 'add_card_title')}</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3 items-end">
          <div><Label>{getAdminLabel(locale, ADMIN_DELIVERY_ZONES_LABELS, 'zone_name')}</Label><Input value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} /></div>
          <div><Label>{getAdminLabel(locale, ADMIN_DELIVERY_ZONES_LABELS, 'district')}</Label><Input value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} /></div>
          <Button onClick={saveZone}>{getAdminLabel(locale, ADMIN_COMMON_LABELS, 'save')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{getAdminLabel(locale, ADMIN_DELIVERY_ZONES_LABELS, 'list_card_title')}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {zones.length === 0 ? <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_DELIVERY_ZONES_LABELS, 'empty')}</p> : zones.map((zone) => (
            <div key={String(zone.id)} className="border rounded-md p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{String(zone.zone_name ?? '-')}</p>
                <p className="text-muted-foreground">{String(zone.district ?? '-')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{getAdminLabel(locale, ADMIN_COMMON_LABELS, 'status_active')}</span>
                <Switch checked={Boolean(zone.is_active)} disabled />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
