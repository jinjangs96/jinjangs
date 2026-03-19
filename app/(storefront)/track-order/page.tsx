'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type TrackResult = {
  order: Record<string, unknown>
  items: Record<string, unknown>[]
  status_history: Record<string, unknown>[]
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TrackResult | null>(null)

  const handleTrackOrder = async () => {
    if (!orderNumber.trim() || !customerPhone.trim()) {
      toast.error('주문번호와 전화번호를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber.trim(),
          customer_phone: customerPhone.trim(),
        }),
      })

      const data = (await response.json()) as {
        error?: string
        order?: Record<string, unknown>
        items?: Record<string, unknown>[]
        status_history?: Record<string, unknown>[]
      }

      if (!response.ok || !data.order) {
        toast.error(data.error || '주문 조회에 실패했습니다.')
        return
      }

      setResult({
        order: data.order,
        items: data.items ?? [],
        status_history: data.status_history ?? [],
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '주문 조회 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>배송 조회</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="order_number">주문번호</Label>
            <Input
              id="order_number"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="예: JJK250319-4821"
            />
          </div>
          <div>
            <Label htmlFor="customer_phone">전화번호</Label>
            <Input
              id="customer_phone"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="예: 090-1234-5678"
            />
          </div>
          <Button className="w-full" onClick={handleTrackOrder} disabled={isLoading}>
            {isLoading ? '조회 중...' : '주문 조회'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>주문 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>주문번호: <strong>{String(result.order.order_number ?? '-')}</strong></p>
            <p>배송조회 코드: <strong>{String(result.order.tracking_code ?? '-')}</strong></p>
            <p>주문 상태: <strong>{String(result.order.order_status ?? '-')}</strong></p>
            <p>결제 상태: <strong>{String(result.order.payment_status ?? '-')}</strong></p>
            <p>상품 결제 금액: <strong>{formatVND(Number(result.order.total_vnd ?? 0))}</strong></p>
            <p className="text-xs text-muted-foreground">배송비는 Grab 실비 기준으로 별도 안내됩니다.</p>

            <div className="pt-2">
              <p className="font-medium mb-2">상품</p>
              <div className="space-y-1 text-muted-foreground">
                {result.items.map((item) => {
                  const options = Array.isArray((item as { options?: unknown }).options)
                    ? ((item as { options?: unknown }).options as unknown[]).map((o) => String(o)).filter(Boolean)
                    : []
                  return (
                    <div key={String(item.id)} className="space-y-1">
                      <p>
                        {String(item.product_name_snapshot ?? '상품')} x{String(item.quantity ?? 1)}
                      </p>
                      {options.length > 0 && (
                        <div className="text-xs text-muted-foreground pl-2 space-y-0.5">
                          {options.map((opt, idx) => (
                            <p key={`${String(item.id)}-opt-${idx}`}>옵션: {opt}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
