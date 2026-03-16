'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AuthGuard } from '@/components/storefront/auth-guard'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

const STATUS_MAP = {
  new: { label: '신규', variant: 'default' as const, color: 'bg-blue-500' },
  accepted: { label: '접수', variant: 'secondary' as const, color: 'bg-cyan-500' },
  preparing: { label: '조리중', variant: 'secondary' as const, color: 'bg-amber-500' },
  out_for_delivery: { label: '배달중', variant: 'secondary' as const, color: 'bg-purple-500' },
  completed: { label: '완료', variant: 'outline' as const, color: 'bg-ok' },
  canceled: { label: '취소', variant: 'destructive' as const, color: 'bg-destructive' },
  pending: { label: '대기', variant: 'secondary' as const, color: 'bg-slate-500' },
}

export default function AccountOrdersPage() {
  const { user } = useAuth()
  const [userOrders, setUserOrders] = useState<Record<string, unknown>[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadOrders() {
      if (!user) return

      setIsLoading(true)
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          toast.error(error.message)
          return
        }

        setUserOrders(data ?? [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '주문 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [user])

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          내 계정
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-6">주문 내역</h1>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">주문 내역을 불러오는 중...</p>
        ) : userOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">주문 내역이 없습니다.</p>
            <Link href="/shop">
              <Badge className="cursor-pointer">메뉴 보러 가기</Badge>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order) => {
              const statusKey = String(order.order_status ?? order.status ?? 'pending') as keyof typeof STATUS_MAP
              const statusInfo = STATUS_MAP[statusKey] ?? STATUS_MAP.pending
              const title = String(order.order_number ?? order.short_id ?? `#${String(order.id).slice(0, 8)}`)
              const createdAt = String(order.created_at ?? '')
              const totalRaw = order.total_amount_vnd ?? order.total_vnd ?? 0
              const total = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw)
              return (
                <Card key={String(order.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{title}</p>
                        <p className="text-xs text-muted-foreground">{createdAt ? formatDate(createdAt) : '-'}</p>
                      </div>
                      <Badge className={`${statusInfo.color} text-white`}>{statusInfo.label}</Badge>
                    </div>

                    <div className="text-sm text-muted-foreground mb-3">
                      결제 상태: {String(order.payment_status ?? 'pending')}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">상품 결제 금액</p>
                        <p className="font-bold text-primary">{formatVND(Number.isFinite(total) ? total : 0)}</p>
                      </div>
                      <Link
                        href={`/account/orders/${String(order.id)}`}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        상세보기
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
