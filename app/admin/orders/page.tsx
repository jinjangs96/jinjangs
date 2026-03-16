'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search, Filter, RefreshCw, ChevronRight, Eye,
  Calendar, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/admin/status-badge'
import { OrderDetailModal } from '@/components/admin/order-detail-modal'
import type { Order, OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const TABS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'new', label: '신규' },
  { value: 'accepted', label: '수락' },
  { value: 'preparing', label: '준비중' },
  { value: 'out_for_delivery', label: '배달중' },
  { value: 'completed', label: '완료' },
  { value: 'canceled', label: '취소' },
]

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  new: { status: 'accepted', label: '수락' },
  accepted: { status: 'preparing', label: '준비중' },
  preparing: { status: 'out_for_delivery', label: '배달중' },
  out_for_delivery: { status: 'completed', label: '완료' },
}

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: '계좌이체',
  qr_transfer: 'QR 송금',
  bank: '계좌이체',
  cod: '착불',
  megapay: 'MegaPay',
}

function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + '₫'
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  })
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const mapOrderRowToOrder = (row: Record<string, unknown>): Order => {
    const statusRaw = String(row.order_status ?? 'new')
    const status: OrderStatus = statusRaw === 'packed' ? 'preparing' : (statusRaw as OrderStatus)
    const paymentRaw = String(row.payment_method ?? 'bank_transfer')
    const paymentMethod = paymentRaw === 'cod' ? 'cod' : paymentRaw === 'megapay' ? 'megapay' : 'bank'
    return {
      id: String(row.id),
      short_id: String(row.order_number ?? row.id).slice(0, 20),
      created_at: String(row.created_at ?? new Date().toISOString()),
      customer_name: String(row.customer_name ?? ''),
      customer_phone: String(row.customer_phone ?? ''),
      address: [String(row.address_line1 ?? ''), String(row.address_line2 ?? '')].filter(Boolean).join(' ').trim(),
      district: String(row.district ?? ''),
      delivery_slot: '',
      slot_text: '-',
      special_requests: String(row.delivery_note ?? ''),
      payment_method: paymentMethod,
      total_vnd: Number(row.total_vnd ?? 0),
      status,
      items: [],
      status_history: [],
      version: 1,
      source_channel: 'web',
      payment_status: 'pending',
      inventory_applied: false,
    }
  }

  useEffect(() => {
    loadOrders().catch(() => null)
  }, [])

  const loadOrders = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token ?? ''
    const response = await fetch('/api/admin/orders/summary', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const result = (await response.json()) as { error?: string; orders?: Record<string, unknown>[] }
    if (!response.ok) {
      toast.error(result.error || '주문 목록을 불러오지 못했습니다.')
      return
    }

    const mapped = (result.orders ?? []).map((row) => mapOrderRowToOrder(row))
    setOrders(mapped)
  }

  const loadOrderDetail = async (orderId: string) => {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token ?? ''
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const result = (await response.json()) as {
      error?: string
      order?: Record<string, unknown>
      items?: Record<string, unknown>[]
      optionSelections?: Record<string, unknown>[]
      statusHistory?: Record<string, unknown>[]
    }
    if (!response.ok || !result.order) {
      toast.error(result.error || '주문 상세를 불러오지 못했습니다.')
      return
    }

    const order = mapOrderRowToOrder(result.order)
    const selectionMap = new Map<string, string[]>()
    for (const selection of result.optionSelections ?? []) {
      const itemId = String(selection.order_item_id)
      const current = selectionMap.get(itemId) ?? []
      current.push(String(selection.option_value_name_snapshot ?? ''))
      selectionMap.set(itemId, current)
    }

    order.items = (result.items ?? []).map((item) => ({
      id: String(item.id),
      name: String(item.product_name_snapshot ?? '상품'),
      qty: Number(item.quantity ?? 0),
      price_vnd: Number(item.unit_price_vnd ?? 0),
      options: (selectionMap.get(String(item.id)) ?? []).join(', ') || undefined,
    }))

    order.status_history = (result.statusHistory ?? []).map((history) => ({
      status:
        String(history.to_status) === 'packed'
          ? 'preparing'
          : (String(history.to_status ?? 'new') as OrderStatus),
      changed_at: String(history.created_at ?? new Date().toISOString()),
      changed_by: String(history.changed_by ?? 'system'),
      note: history.note ? String(history.note) : undefined,
    }))

    setSelectedOrder(order)
  }

  const today = new Date().toDateString()
  const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (activeTab !== 'all' && o.status !== activeTab) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !o.short_id.toLowerCase().includes(q) &&
          !o.customer_name.toLowerCase().includes(q) &&
          !o.customer_phone.includes(q)
        )
          return false
      }
      if (paymentFilter !== 'all' && o.payment_method !== paymentFilter) return false
      if (dateFilter === 'today' && new Date(o.created_at).toDateString() !== today) return false
      if (dateFilter === 'last_7' && new Date(o.created_at) < last7) return false
      return true
    })
  }, [orders, activeTab, search, paymentFilter, dateFilter])

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length }
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1
    })
    return counts
  }, [orders])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, cancelReason?: string) => {
    if (newStatus === 'canceled' && !cancelReason?.trim()) {
      toast.error('취소 사유를 입력해주세요.')
      return
    }

    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token ?? ''
    const response = await fetch('/api/admin/orders/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId,
        toStatus: newStatus,
        note: cancelReason,
      }),
    })
    const result = (await response.json()) as { error?: string; detail?: string }
    if (!response.ok) {
      const message = result.detail ? `${result.error || '상태 변경 실패'}\n${result.detail}` : (result.error || '상태 변경 실패')
      toast.error(message)
      throw new Error(result.error || '상태 변경 실패')
    }
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o
        const now = new Date().toISOString()
        return {
          ...o,
          status: newStatus,
          cancel_reason: cancelReason ?? o.cancel_reason,
          version: o.version + 1,
          status_history: [
            ...o.status_history,
            {
              status: newStatus,
              changed_at: now,
              changed_by: 'admin@jinjang.vn',
              note: cancelReason,
            },
          ],
        }
      })
    )
    if (selectedOrder?.id === orderId) {
      void loadOrderDetail(orderId)
    }
  }

  const openDetail = (order: Order) => {
    setSelectedOrder(order)
    setModalOpen(true)
    void loadOrderDetail(order.id)
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">주문 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">총 {orders.length}건의 주문</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-2"
          onClick={() => { loadOrders().then(() => toast.success('새로고침되었습니다.')) }}
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-4 overflow-x-auto pb-1">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderStatus | 'all')}>
          <TabsList className="bg-muted/50 rounded-xl h-auto p-1 gap-0.5 flex flex-nowrap w-max">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm whitespace-nowrap"
              >
                {tab.label}
                {tabCounts[tab.value] ? (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {tabCounts[tab.value]}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 rounded-xl"
            placeholder="주문번호 / 이름 / 전화번호 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="rounded-xl w-36">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="결제수단" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">전체 결제</SelectItem>
            <SelectItem value="bank">계좌이체</SelectItem>
            <SelectItem value="cod">착불(COD)</SelectItem>
            <SelectItem value="megapay" disabled>MegaPay 결제(예정)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="rounded-xl w-36">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="날짜" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">전체 기간</SelectItem>
            <SelectItem value="today">오늘</SelectItem>
            <SelectItem value="last_7">최근 7일</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['주문번호', '일시', '고객', '금액', '결제', '지역', '슬롯', '상태', '액션'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide first:pl-6 last:pr-6">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center text-muted-foreground text-sm">
                  주문이 없습니다.
                </td>
              </tr>
            )}
            {filtered.map((order) => {
              const next = NEXT_STATUS[order.status]
              const canCancel = !['completed', 'canceled'].includes(order.status)
              return (
                <tr
                  key={order.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => openDetail(order)}
                >
                  <td className="px-6 py-3.5 text-sm font-mono font-medium text-foreground">{order.short_id}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-foreground">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-foreground whitespace-nowrap">{formatVND(order.total_vnd)}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">{PAYMENT_LABELS[order.payment_method]}</td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">{order.district}</td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-24 truncate">{order.slot_text}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 pr-6 py-3.5">
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded-lg"
                        onClick={() => openDetail(order)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {next && (
                        <Button
                          size="sm"
                          className="h-7 px-2 rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => {
                            // Quick status advance from table
                            if (next.status === 'completed') {
                              openDetail(order)
                            } else {
                              handleStatusChange(order.id, next.status).then(() =>
                                toast.success('상태가 변경되었습니다.')
                              )
                            }
                          }}
                        >
                          {next.label}
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 rounded-lg text-xs border-destructive/50 text-destructive hover:bg-destructive/5"
                          onClick={() => openDetail(order)}
                        >
                          취소
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">주문이 없습니다.</div>
        )}
        {filtered.map((order) => (
          <div
            key={order.id}
            className="bg-card border border-border rounded-2xl p-4 shadow-sm cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => openDetail(order)}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-mono font-semibold text-sm text-foreground">{order.short_id}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.created_at)}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{order.customer_name}</p>
                <p className="text-xs text-muted-foreground">{order.district} · {order.slot_text}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{formatVND(order.total_vnd)}</p>
                <p className="text-xs text-muted-foreground">{PAYMENT_LABELS[order.payment_method]}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 text-primary text-xs font-medium">
              상세보기 <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setSelectedOrder(null)
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
