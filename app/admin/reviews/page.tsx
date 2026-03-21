'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_REVIEWS_LABELS, getAdminLabel } from '@/lib/admin-i18n'

type ReviewRow = Record<string, unknown>

export default function AdminReviewsPage() {
  const { locale } = useAdminLocale()
  const [rows, setRows] = useState<ReviewRow[]>([])

  useEffect(() => {
    async function loadRows() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token ?? ''
        const response = await fetch('/api/admin/reviews', { headers: { Authorization: `Bearer ${token}` } })
        const result = (await response.json()) as { error?: string; reviews?: ReviewRow[] }
        if (!response.ok) {
          toast.error(result.error || getAdminLabel(locale, ADMIN_REVIEWS_LABELS, 'load_failed'))
          return
        }
        setRows(result.reviews ?? [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : getAdminLabel(locale, ADMIN_REVIEWS_LABELS, 'load_error'))
      }
    }
    loadRows()
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader><CardTitle>{getAdminLabel(locale, ADMIN_REVIEWS_LABELS, 'page_title')}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {rows.length === 0 ? <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_REVIEWS_LABELS, 'empty')}</p> : rows.map((row) => (
            <div key={String(row.id)} className="border rounded-md p-3">
              <p>{getAdminLabel(locale, ADMIN_REVIEWS_LABELS, 'author')}: {String(row.user_id ?? '-')}</p>
              <p>{getAdminLabel(locale, ADMIN_REVIEWS_LABELS, 'rating')}: {String(row.rating ?? '-')}</p>
              <p className="text-muted-foreground">{String(row.comment ?? row.content ?? '')}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
