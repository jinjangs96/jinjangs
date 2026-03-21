'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_USERS_LABELS, ADMIN_COMMON_LABELS, ADMIN_ROLE_LABELS, getAdminLabel } from '@/lib/admin-i18n'

type Detail = {
  role?: { role?: string; is_active?: boolean }
  profile?: { full_name?: string; email?: string; phone?: string }
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const { locale } = useAdminLocale()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [role, setRole] = useState('viewer')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    async function loadDetail() {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''
      const response = await fetch(`/api/admin/users/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      const result = (await response.json()) as { error?: string; user?: Detail }
      if (!response.ok || !result.user) {
        toast.error(result.error || getAdminLabel(locale, ADMIN_USERS_LABELS, 'detail_load_failed'))
        return
      }
      setDetail(result.user)
      setRole(result.user.role?.role || 'viewer')
      setIsActive(Boolean(result.user.role?.is_active))
    }
    loadDetail().catch(() => null)
  }, [params.id])

  const save = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token ?? ''
    const response = await fetch(`/api/admin/users/${params.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role, is_active: isActive }),
    })
    const result = (await response.json()) as { error?: string }
    if (!response.ok) {
      toast.error(result.error || getAdminLabel(locale, ADMIN_USERS_LABELS, 'save_failed'))
      return
    }
    toast.success(getAdminLabel(locale, ADMIN_USERS_LABELS, 'save_success'))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader><CardTitle>{getAdminLabel(locale, ADMIN_USERS_LABELS, 'detail_title')}</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{getAdminLabel(locale, ADMIN_USERS_LABELS, 'name')}: {detail?.profile?.full_name || '-'}</p>
          <p>{getAdminLabel(locale, ADMIN_USERS_LABELS, 'email')}: {detail?.profile?.email || '-'}</p>
          <p>{getAdminLabel(locale, ADMIN_USERS_LABELS, 'phone')}: {detail?.profile?.phone || '-'}</p>
          <div>
            <Label>{getAdminLabel(locale, ADMIN_USERS_LABELS, 'role')}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">{getAdminLabel(locale, ADMIN_ROLE_LABELS, 'owner')}</SelectItem>
                <SelectItem value="ops_manager">{getAdminLabel(locale, ADMIN_ROLE_LABELS, 'ops_manager')}</SelectItem>
                <SelectItem value="staff">{getAdminLabel(locale, ADMIN_ROLE_LABELS, 'staff')}</SelectItem>
                <SelectItem value="finance">{getAdminLabel(locale, ADMIN_ROLE_LABELS, 'finance')}</SelectItem>
                <SelectItem value="viewer">{getAdminLabel(locale, ADMIN_ROLE_LABELS, 'viewer')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span>{getAdminLabel(locale, ADMIN_USERS_LABELS, 'active_account')}</span>
          </div>
          <Button onClick={save}>{getAdminLabel(locale, ADMIN_COMMON_LABELS, 'save')}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
