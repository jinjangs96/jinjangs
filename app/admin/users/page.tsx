'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type UserRow = Record<string, unknown>

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])

  useEffect(() => {
    async function loadUsers() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token ?? ''
        const response = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
        const result = (await response.json()) as { error?: string; users?: UserRow[] }
        if (!response.ok) {
          toast.error(result.error || '직원 목록 조회 실패')
          return
        }
        setUsers(result.users ?? [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '직원 목록 조회 중 오류')
      }
    }
    loadUsers()
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader><CardTitle>직원 관리</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {users.length === 0 ? <p className="text-muted-foreground">데이터가 없습니다.</p> : users.map((user) => (
            <div key={String(user.user_id)} className="border rounded-md p-3">
              <p className="font-medium">{String(user.full_name ?? user.email ?? user.user_id)}</p>
              <p>역할: {String(user.role ?? '-')}</p>
              <p>상태: {Boolean(user.is_active) ? '활성' : '비활성'}</p>
              <Link href={`/admin/users/${String(user.user_id)}`} className="underline text-primary">상세 보기</Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
