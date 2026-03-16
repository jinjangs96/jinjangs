'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight, TrendingUp } from 'lucide-react'
import { StatusBadge } from '@/components/admin/status-badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + '₫'
}

type DashboardStats = {
  orders: number
  members: number
  inventoryItems: number
  payments: number
}

type DashboardOrder = {
  [key: string]: unknown
}

const INITIAL_STATS: DashboardStats = {
  orders: 0,
  members: 0,
  inventoryItems: 0,
  payments: 0,
}

const KPI_CARDS = [
  {
    key: 'new',
    label: '주문 수',
    icon: ShoppingBag,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    getValue: (s: DashboardStats) => s.orders,
  },
  {
    key: 'progress',
    label: '회원 수',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    getValue: (s: DashboardStats) => s.members,
  },
  {
    key: 'completed',
    label: '재고 품목',
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
    getValue: (s: DashboardStats) => s.inventoryItems,
  },
  {
    key: 'canceled',
    label: '결제 건수',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    getValue: (s: DashboardStats) => s.payments,
  },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS)
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([])
  const [monthly, setMonthly] = useState<Record<string, unknown>[]>([])
  const [channels, setChannels] = useState<Record<string, unknown>[]>([])
  const [products, setProducts] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [apiErrors, setApiErrors] = useState<string[]>([])

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token ?? ''
        const response = await fetch('/api/admin/dashboard', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
          credentials: 'include',
        })
        const result = (await response.json()) as {
          ok?: boolean
          counts?: DashboardStats
          monthly?: Record<string, unknown>[]
          channels?: Record<string, unknown>[]
          products?: Record<string, unknown>[]
          errors?: string[]
        }
        if (!response.ok) {
          toast.error('대시보드 데이터를 불러오지 못했습니다.')
          setStats(INITIAL_STATS)
          setMonthly([])
          setChannels([])
          setProducts([])
          setApiErrors([])
          return
        }

        setStats(result.counts ?? INITIAL_STATS)
        setMonthly(result.monthly ?? [])
        setChannels(result.channels ?? [])
        setProducts(result.products ?? [])
        setApiErrors(result.errors ?? [])
        setRecentOrders([])
      } catch (error) {
        toast.error('대시보드 조회 중 오류가 발생했습니다.')
        setStats(INITIAL_STATS)
        setMonthly([])
        setChannels([])
        setProducts([])
        setApiErrors([])
      } finally {
        setLoading(false)
      }
    }

    loadDashboard().catch(() => {
      setLoading(false)
    })
  }, [])

  return (
    <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {loading && (
        <div className="mb-4 text-sm text-muted-foreground">대시보드 데이터를 불러오는 중...</div>
      )}

      {/* Failed Email Banner */}
      {apiErrors.length > 0 && (
        <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-3.5">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <p className="text-sm">
            일부 지표를 불러오지 못했습니다. 가능한 데이터만 표시 중입니다.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPI_CARDS.map(({ key, label, icon: Icon, color, bg, border, getValue }) => (
          <div
            key={key}
            className={cn('bg-card border rounded-2xl shadow-sm p-5', border)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{getValue(stats)}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Card */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">월간 요약/채널/상품 뷰 상태</p>
            <p className="text-2xl font-bold text-foreground">
              {monthly.length} / {channels.length} / {products.length}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">대시보드 데이터 미리보기</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
          >
            전체보기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['주문번호', '고객', '금액', '결제', '슬롯', '상태'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(recentOrders.length > 0 ? recentOrders : monthly.slice(0, 5)).map((order, index) => (
                <tr key={String(order.id ?? order.order_number ?? order.sales_month ?? index)} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-3 text-sm font-mono font-medium text-foreground">
                    {String(order.order_number ?? order.sales_month ?? `#${index + 1}`)}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-foreground">{String(order.customer_name ?? '-')}</p>
                    <p className="text-xs text-muted-foreground">{String(order.created_at ?? order.sales_month ?? '-')}</p>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-foreground">{formatVND(Number(order.total_vnd ?? order.gross_revenue_vnd ?? 0))}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {String(order.payment_method ?? '-')}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">-</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={(String(order.order_status ?? 'new') === 'packed' ? 'preparing' : String(order.order_status ?? 'new')) as 'new' | 'accepted' | 'preparing' | 'out_for_delivery' | 'completed' | 'canceled'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border">
          {(recentOrders.length > 0 ? recentOrders : monthly.slice(0, 5)).map((order, index) => (
            <div key={String(order.id ?? order.order_number ?? order.sales_month ?? index)} className="px-5 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-mono font-semibold text-foreground">{String(order.order_number ?? order.sales_month ?? `#${index + 1}`)}</p>
                <p className="text-sm text-foreground mt-0.5">{String(order.customer_name ?? '-')}</p>
                <p className="text-xs text-muted-foreground">{String(order.created_at ?? order.sales_month ?? '-')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground">{formatVND(Number(order.total_vnd ?? order.gross_revenue_vnd ?? 0))}</p>
                <div className="mt-1">
                  <StatusBadge status={(String(order.order_status ?? 'new') === 'packed' ? 'preparing' : String(order.order_status ?? 'new')) as 'new' | 'accepted' | 'preparing' | 'out_for_delivery' | 'completed' | 'canceled'} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
