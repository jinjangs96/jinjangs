'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthGuard } from '@/components/storefront/auth-guard'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

function formatPaymentMethod(paymentMethod: string) {
  const map: Record<string, string> = {
    bank_transfer: '계좌이체',
    qr_transfer: 'QR 송금',
    cod: '현금결제',
    megapay: 'MegaPay',
  }
  return map[paymentMethod] || paymentMethod || '-'
}

export default function AccountOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [order, setOrder] = useState<Record<string, unknown> | null>(null)
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadOrderDetail() {
      if (!user || !id) return

      setIsLoading(true)
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (orderError) {
          toast.error(orderError.message)
          return
        }

        if (!orderData) {
          setOrder(null)
          setItems([])
          return
        }

        setOrder(orderData)

        const { data: itemData, error: itemError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', id)

        if (itemError) {
          setItems([])
          toast.error(itemError.message)
          return
        }

        const baseItems = (itemData ?? []).map((item) => ({
          ...item,
          selected_option_labels: [] as string[],
        }))

        const orderItemIds = baseItems.map((item) => String(item.id)).filter(Boolean)
        if (orderItemIds.length > 0) {
          const { data: optionData, error: optionError } = await supabase
            .from('order_item_option_selections')
            .select('order_item_id,option_group_name_snapshot,option_value_name_snapshot')
            .in('order_item_id', orderItemIds)

          if (optionError) {
            toast.error(optionError.message)
          } else if (optionData && optionData.length > 0) {
            const optionsByItemId = optionData.reduce<Record<string, string[]>>((acc, option) => {
              const itemId = String(option.order_item_id ?? '')
              const group = String(option.option_group_name_snapshot ?? '')
              const value = String(option.option_value_name_snapshot ?? '')
              if (!itemId || !value) return acc
              const label = group ? `${group}: ${value}` : value
              if (!acc[itemId]) acc[itemId] = []
              acc[itemId].push(label)
              return acc
            }, {})

            for (const item of baseItems) {
              const itemId = String(item.id ?? '')
              item.selected_option_labels = optionsByItemId[itemId] ?? []
            }
          }
        }

        setItems(baseItems)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '주문 상세 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrderDetail()
  }, [id, user])

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          주문 내역
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-6">주문 상세</h1>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">주문 정보를 불러오는 중...</p>
        ) : !order ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              주문 정보를 찾을 수 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">주문 정보</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>주문번호: {String(order.order_number ?? order.id ?? '-')}</p>
                <p>
                  주문일시:{' '}
                  {order.created_at ? formatDateTime(String(order.created_at)) : '-'}
                </p>
                <p>상태: {String(order.order_status ?? '-')}</p>
                <p>결제 상태: {String(order.payment_status ?? '-')}</p>
                <p>결제 방식: {formatPaymentMethod(String(order.payment_method ?? '-'))}</p>
                <p>수령인: {String(order.recipient_name ?? '-')}</p>
                <p>수령인 전화번호: {String(order.recipient_phone ?? '-')}</p>
                <p>
                  주소:{' '}
                  {[
                    String(order.district ?? '').trim(),
                    String(order.ward ?? '').trim(),
                    String(order.address_line1 ?? '').trim(),
                    String(order.address_line2 ?? '').trim(),
                  ]
                    .filter(Boolean)
                    .join(' ') || '-'}
                </p>
                <p>배송 메모: {String(order.delivery_note ?? '-')}</p>
                <p>
                  상품 결제 금액:{' '}
                  {formatVND(
                    Number(
                      (order.total_amount_vnd as number | string | undefined) ??
                        (order.total_vnd as number | string | undefined) ??
                        0
                    )
                  )}
                </p>
                <p className="text-xs text-muted-foreground pt-1">배송비는 Grab 실비 기준으로 별도 안내됩니다.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">주문 상품</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">주문 상품 정보가 없습니다.</p>
                ) : (
                  items.map((item) => {
                    const labels = Array.isArray(item.selected_option_labels)
                      ? item.selected_option_labels.map((label) => String(label)).filter(Boolean)
                      : []
                    return (
                      <div key={String(item.id)} className="text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span>
                            {String(item.product_name_snapshot ?? item.product_name ?? item.name ?? '상품')}
                          </span>
                          <span>x{String(item.quantity ?? item.qty ?? 1)}</span>
                        </div>
                        {labels.length > 0 && (
                          <p className="text-xs text-muted-foreground">옵션: {labels.join(', ')}</p>
                        )}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
