'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Row = { product_name: string; qty: number; revenue: number }

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

export default function AdminReportsProductsPage() {
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    async function loadRows() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token ?? ''
        const response = await fetch('/api/admin/reports/products', { headers: { Authorization: `Bearer ${token}` } })
        const result = (await response.json()) as { error?: string; products?: Row[] }
        if (!response.ok) {
          toast.error(result.error || '상품 리포트 조회 실패')
          return
        }
        setRows(result.products ?? [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '상품 리포트 조회 중 오류')
      }
    }
    loadRows()
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader><CardTitle>상품별 매출</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {rows.length === 0 ? <p className="text-muted-foreground">데이터가 없습니다.</p> : rows.map((row) => (
            <div key={row.product_name} className="border rounded-md p-3">
              <p className="font-medium">{row.product_name}</p>
              <p>판매 수량 {row.qty}</p>
              <p>매출 {formatVND(row.revenue)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
