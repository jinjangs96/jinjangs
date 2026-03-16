'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Zone = Record<string, unknown>

export default function AdminDeliveryZonesPage() {
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
      toast.error(result.error || '배송 구역 조회 실패')
      return
    }
    setZones(result.zones ?? [])
  }

  useEffect(() => {
    loadZones().catch(() => null)
  }, [])

  const saveZone = async () => {
    if (!newZoneName.trim() || !newDistrict.trim()) {
      toast.error('구역명/지역을 입력해주세요.')
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
      toast.error(result.error || '저장 실패')
      return
    }
    toast.success('배송구역이 저장되었습니다.')
    setNewZoneName('')
    setNewDistrict('')
    await loadZones()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader><CardTitle>배송구역 추가</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3 items-end">
          <div><Label>구역명</Label><Input value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} /></div>
          <div><Label>지역</Label><Input value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} /></div>
          <Button onClick={saveZone}>저장</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>배송구역 목록</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {zones.length === 0 ? <p className="text-muted-foreground">데이터가 없습니다.</p> : zones.map((zone) => (
            <div key={String(zone.id)} className="border rounded-md p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{String(zone.zone_name ?? '-')}</p>
                <p className="text-muted-foreground">{String(zone.district ?? '-')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">활성</span>
                <Switch checked={Boolean(zone.is_active)} disabled />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
