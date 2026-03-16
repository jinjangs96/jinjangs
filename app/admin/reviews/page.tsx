'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type ReviewRow = Record<string, unknown>

export default function AdminReviewsPage() {
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
          toast.error(result.error || '리뷰 조회 실패')
          return
        }
        setRows(result.reviews ?? [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '리뷰 조회 중 오류')
      }
    }
    loadRows()
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader><CardTitle>리뷰 관리</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {rows.length === 0 ? <p className="text-muted-foreground">리뷰 데이터가 없습니다.</p> : rows.map((row) => (
            <div key={String(row.id)} className="border rounded-md p-3">
              <p>작성자: {String(row.user_id ?? '-')}</p>
              <p>평점: {String(row.rating ?? '-')}</p>
              <p className="text-muted-foreground">{String(row.comment ?? row.content ?? '')}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
