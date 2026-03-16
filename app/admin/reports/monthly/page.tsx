'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

export default function AdminReportsMonthlyPage() {
  const [monthlyRows, setMonthlyRows] = useState<Record<string, unknown>[]>([])
  const [productRows, setProductRows] = useState<Record<string, unknown>[]>([])
  const [channelRows, setChannelRows] = useState<Record<string, unknown>[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRows() {
      setLoading(true)
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token ?? ''
        const response = await fetch('/api/admin/reports/monthly', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
          credentials: 'include',
        })
        const result = (await response.json()) as {
          ok?: boolean
          monthly?: Record<string, unknown>[]
          products?: Record<string, unknown>[]
          channels?: Record<string, unknown>[]
          errors?: string[]
        }
        if (!response.ok) {
          toast.error('월별 리포트 조회 실패')
          setMonthlyRows([])
          setProductRows([])
          setChannelRows([])
          setErrors([])
          return
        }
        setMonthlyRows(result.monthly ?? [])
        setProductRows(result.products ?? [])
        setChannelRows(result.channels ?? [])
        setErrors(result.errors ?? [])
      } catch (error) {
        toast.error('월별 리포트 조회 중 오류')
        setMonthlyRows([])
        setProductRows([])
        setChannelRows([])
        setErrors([])
      } finally {
        setLoading(false)
      }
    }
    loadRows().catch(() => {
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader><CardTitle>월별 주문/매출</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {loading && <p className="text-muted-foreground">리포트를 불러오는 중...</p>}
          {errors.length > 0 && (
            <p className="text-amber-600">일부 데이터를 불러오지 못했습니다. 가능한 데이터만 표시합니다.</p>
          )}
          {!loading && monthlyRows.length === 0 && <p className="text-muted-foreground">데이터가 없습니다.</p>}
          {monthlyRows.map((row, idx) => (
            <div key={String(row.sales_month ?? idx)} className="border rounded-md p-3">
              <p className="font-medium">{String(row.sales_month ?? '-')}</p>
              <p>주문 {Number(row.orders_count ?? 0)}건</p>
              <p>매출 {formatVND(Number(row.paid_revenue_vnd ?? row.gross_revenue_vnd ?? 0))}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader><CardTitle>채널 요약</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {channelRows.length === 0 ? <p className="text-muted-foreground">데이터가 없습니다.</p> : channelRows.slice(0, 10).map((row, idx) => (
              <div key={String(row.source_channel ?? idx)} className="border rounded-md p-3">
                <p>{String(row.source_channel ?? '-')}</p>
                <p>주문 {Number(row.orders_count ?? 0)}건</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>상품 요약</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {productRows.length === 0 ? <p className="text-muted-foreground">데이터가 없습니다.</p> : productRows.slice(0, 10).map((row, idx) => (
              <div key={String(row.product_id ?? row.product_name_snapshot ?? idx)} className="border rounded-md p-3">
                <p>{String(row.product_name_snapshot ?? '-')}</p>
                <p>수량 {Number(row.units_sold ?? 0)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
