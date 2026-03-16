'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Search, ArrowUpCircle, ArrowDownCircle, RefreshCw, Trash2, ShoppingBag, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { InventoryMovement, InventoryMovementType } from '@/lib/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const TYPE_CONFIG: Record<InventoryMovementType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  in: { label: '입고', icon: ArrowUpCircle, color: 'text-green-600' },
  out: { label: '출고', icon: ArrowDownCircle, color: 'text-orange-600' },
  adjust: { label: '조정', icon: RefreshCw, color: 'text-blue-600' },
  waste: { label: '폐기', icon: Trash2, color: 'text-destructive' },
  order_deduct: { label: '주문 차감', icon: ShoppingBag, color: 'text-primary' },
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

export default function InventoryMovementsPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [itemsByProductId, setItemsByProductId] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<InventoryMovementType | 'all'>('all')

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token ?? ''
        const response = await fetch('/api/admin/inventory/summary', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = (await response.json()) as {
          error?: string
          items?: Array<{ product_id: string; product_name: string }>
          movements?: Array<Record<string, unknown>>
        }
        if (!response.ok) {
          toast.error(result.error || '입출고 내역 조회 실패')
          return
        }

        const map: Record<string, string> = {}
        for (const item of result.items ?? []) map[item.product_id] = item.product_name
        setItemsByProductId(map)

        const mappedMovements: InventoryMovement[] = (result.movements ?? []).map((row) => ({
          id: String(row.id),
          inventory_item_id: String(row.product_id),
          product_id: String(row.product_id),
          type: String(row.movement_type) as InventoryMovementType,
          qty_change: Number(row.quantity_delta ?? 0),
          qty_before: 0,
          qty_after: 0,
          reason: String(row.note ?? row.reference_type ?? '-'),
          order_id: row.reference_id ? String(row.reference_id) : undefined,
          created_by: String(row.created_by ?? 'system'),
          created_at: String(row.created_at ?? new Date().toISOString()),
        }))
        setMovements(mappedMovements)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '입출고 내역 조회 중 오류')
      }
    }

    loadData()
  }, [])

  // Get product name from inventory items
  const getProductName = (productId: string) => {
    return itemsByProductId[productId] || productId
  }

  const filteredMovements = movements.filter(mov => {
    const productName = getProductName(mov.product_id)
    const matchesSearch = productName.toLowerCase().includes(search.toLowerCase()) ||
                          mov.reason.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || mov.type === typeFilter
    return matchesSearch && matchesType
  })

  // Calculate today's summary
  const today = new Date().toISOString().split('T')[0]
  const todayMovements = movements.filter(m => m.created_at.startsWith(today))
  const todayIn = todayMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.qty_change, 0)
  const todayOut = Math.abs(todayMovements.filter(m => m.type !== 'in').reduce((sum, m) => sum + m.qty_change, 0))

  return (
    <div className="px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/inventory">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">입출고 내역</h1>
            <p className="text-sm text-muted-foreground mt-1">재고 변동 히스토리</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">오늘 입고</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">+{todayIn}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">오늘 출고</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">-{todayOut}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">오늘 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayMovements.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">전체 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{movements.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="상품명, 사유 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as InventoryMovementType | 'all')}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="유형 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="in">입고</SelectItem>
            <SelectItem value="out">출고</SelectItem>
            <SelectItem value="adjust">조정</SelectItem>
            <SelectItem value="waste">폐기</SelectItem>
            <SelectItem value="order_deduct">주문 차감</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>일시</TableHead>
              <TableHead>상품</TableHead>
              <TableHead>유형</TableHead>
              <TableHead className="text-right">변동</TableHead>
              <TableHead className="text-right">변동 후</TableHead>
              <TableHead>사유</TableHead>
              <TableHead>처리자</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  입출고 내역이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((mov) => {
                const config = TYPE_CONFIG[mov.type]
                const Icon = config.icon
                return (
                  <TableRow key={mov.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(mov.created_at)}
                    </TableCell>
                    <TableCell className="font-medium">{getProductName(mov.product_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        <Icon className={`w-3 h-3 mr-1 ${config.color}`} />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={mov.qty_change > 0 ? 'text-green-600' : 'text-destructive'}>
                        {mov.qty_change > 0 ? '+' : ''}{mov.qty_change}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {mov.qty_after}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {mov.order_id ? (
                        <Link href={`/admin/orders?id=${mov.order_id}`} className="text-primary hover:underline">
                          {mov.reason}
                        </Link>
                      ) : (
                        mov.reason
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {mov.created_by.split('@')[0]}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
