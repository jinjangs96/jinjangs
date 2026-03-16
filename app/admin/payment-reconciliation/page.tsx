'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type PaymentRow = Record<string, unknown>

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

export default function AdminPaymentReconciliationPage() {
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadRows = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''
      const response = await fetch('/api/admin/payment-reconciliation', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = (await response.json()) as { error?: string; payments?: PaymentRow[] }
      if (!response.ok) {
        toast.error(result.error || '결제 내역을 불러오지 못했습니다.')
        return
      }
      setRows(result.payments ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '결제 내역 조회 중 오류가 발생했습니다.')
    }
  }, [])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const updateStatus = async (paymentId: string, toStatus: string) => {
    setUpdatingId(paymentId)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''
      const response = await fetch('/api/admin/payment-reconciliation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payment_id: paymentId, to_status: toStatus }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        toast.error(result.error || '상태 변경에 실패했습니다.')
        return
      }
      toast.success('결제 상태가 변경되었습니다.')
      await loadRows()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>결제 확인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {rows.length === 0 ? (
            <p className="text-muted-foreground">결제 내역이 없습니다.</p>
          ) : (
            rows.map((row) => {
              const id = String(row.id)
              const status = String(row.payment_status ?? '')
              const canConfirm = status === 'pending' || status === 'transfer_waiting'
              const isUpdating = updatingId === id
              return (
                <div key={id} className="rounded-md border p-3">
                  <p>주문: {String((row.orders as Record<string, unknown> | null)?.order_number ?? '-')}</p>
                  <p>결제수단: {String(row.method ?? '-')}</p>
                  <p>상태: {status}</p>
                  <p>금액: {formatVND(Number(row.expected_amount_vnd ?? 0))}</p>
                  {canConfirm && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isUpdating}
                        onClick={() => updateStatus(id, 'paid')}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                            처리 중...
                          </>
                        ) : (
                          '입금 확인'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating}
                        onClick={() => updateStatus(id, 'failed')}
                      >
                        실패 처리
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
