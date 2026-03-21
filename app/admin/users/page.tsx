'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_USERS_LABELS, ADMIN_COMMON_LABELS, getAdminLabel } from '@/lib/admin-i18n'

type UserRow = Record<string, unknown>

export default function AdminUsersPage() {
  const { locale } = useAdminLocale()
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
          toast.error(result.error || getAdminLabel(locale, ADMIN_USERS_LABELS, 'load_failed'))
          return
        }
        setUsers(result.users ?? [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : getAdminLabel(locale, ADMIN_USERS_LABELS, 'load_error'))
      }
    }
    loadUsers()
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader><CardTitle>{getAdminLabel(locale, ADMIN_USERS_LABELS, 'page_title')}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {users.length === 0 ? <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_USERS_LABELS, 'empty')}</p> : users.map((user) => (
            <div key={String(user.user_id)} className="border rounded-md p-3">
              <p className="font-medium">{String(user.full_name ?? user.email ?? user.user_id)}</p>
              <p>{getAdminLabel(locale, ADMIN_USERS_LABELS, 'role')}: {String(user.role ?? '-')}</p>
              <p>{getAdminLabel(locale, ADMIN_USERS_LABELS, 'status')}: {Boolean(user.is_active) ? getAdminLabel(locale, ADMIN_COMMON_LABELS, 'status_active') : getAdminLabel(locale, ADMIN_COMMON_LABELS, 'status_inactive')}</p>
              <Link href={`/admin/users/${String(user.user_id)}`} className="underline text-primary">{getAdminLabel(locale, ADMIN_USERS_LABELS, 'view_detail')}</Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
