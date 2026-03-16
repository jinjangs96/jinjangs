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

type Detail = {
  role?: { role?: string; is_active?: boolean }
  profile?: { full_name?: string; email?: string; phone?: string }
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
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
        toast.error(result.error || '사용자 상세 조회 실패')
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
      toast.error(result.error || '저장 실패')
      return
    }
    toast.success('권한이 저장되었습니다.')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader><CardTitle>직원 상세</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>이름: {detail?.profile?.full_name || '-'}</p>
          <p>이메일: {detail?.profile?.email || '-'}</p>
          <p>전화: {detail?.profile?.phone || '-'}</p>
          <div>
            <Label>역할</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">owner</SelectItem>
                <SelectItem value="ops_manager">ops_manager</SelectItem>
                <SelectItem value="staff">staff</SelectItem>
                <SelectItem value="finance">finance</SelectItem>
                <SelectItem value="viewer">viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span>활성 계정</span>
          </div>
          <Button onClick={save}>저장</Button>
        </CardContent>
      </Card>
    </div>
  )
}
