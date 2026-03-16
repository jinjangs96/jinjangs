'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, AlertTriangle, Package, ArrowRightLeft, Filter } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useStaff } from '@/lib/staff-context'
import type { InventoryItem, InventoryMovementType } from '@/lib/types'
import { toast } from 'sonner'

function formatNumber(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n)
}

export default function InventoryPage() {
  const { hasPermission } = useStaff()
  const canEdit = hasPermission('inventory.edit')
  
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<Array<{ quantity_delta: number; movement_type: string; created_at: string }>>([])
  const [search, setSearch] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; item: InventoryItem | null }>({ open: false, item: null })
  const [adjustForm, setAdjustForm] = useState({ type: 'in' as InventoryMovementType, qty: 0, reason: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadInventory().catch(() => null)
  }, [])

  const loadInventory = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token ?? ''
    const response = await fetch('/api/admin/inventory/summary', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const result = (await response.json()) as {
      error?: string
      items?: InventoryItem[]
      movements?: Array<{ quantity_delta: number; movement_type: string; created_at: string }>
    }
    if (!response.ok) {
      toast.error(result.error || '재고 조회 실패')
      return
    }
    setItems(result.items ?? [])
    setMovements(result.movements ?? [])
  }

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.product_name.toLowerCase().includes(search.toLowerCase())
      const matchesLowStock = showLowStock ? item.current_qty <= item.low_stock_threshold : true
      return matchesSearch && matchesLowStock
    })
  }, [items, search, showLowStock])

  const lowStockCount = items.filter(i => i.current_qty <= i.low_stock_threshold).length
  const totalItems = items.reduce((sum, i) => sum + i.current_qty, 0)

  const today = new Date().toISOString().split('T')[0]
  const todayMovements = movements.filter(m => String(m.created_at ?? '').startsWith(today))
  const todayIn = todayMovements.filter(m => Number(m.quantity_delta ?? 0) > 0).reduce((sum, m) => sum + Number(m.quantity_delta), 0)
  const todayOut = Math.abs(todayMovements.filter(m => Number(m.quantity_delta ?? 0) < 0).reduce((sum, m) => sum + Number(m.quantity_delta), 0))

  const handleAdjust = async () => {
    if (!adjustDialog.item || adjustForm.qty <= 0) return

    setIsSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''
      const response = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: adjustDialog.item.product_id,
          movement_type: adjustForm.type,
          quantity: adjustForm.qty,
          reason: adjustForm.reason,
        }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        toast.error(result.error || '재고 조정 실패')
        return
      }

      toast.success(`${adjustDialog.item.product_name} 재고 조정 완료`)
      setAdjustDialog({ open: false, item: null })
      setAdjustForm({ type: 'in', qty: 0, reason: '' })
      await loadInventory()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '재고 조정 중 오류')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">재고 현황</h1>
          <p className="text-sm text-muted-foreground mt-1">상품별 재고 수량 및 부족 알림</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inventory/movements">
            <Button variant="outline" size="sm">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              입출고 내역
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">총 품목</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">총 재고</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalItems)}</p>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              부족 품목
              {lowStockCount > 0 && <AlertTriangle className="w-4 h-4 text-destructive" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-destructive' : ''}`}>{lowStockCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">오늘 변동</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">+{todayIn} / -{todayOut}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="상품명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showLowStock ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowLowStock(!showLowStock)}
        >
          <Filter className="w-4 h-4 mr-2" />
          부족 품목만
          {lowStockCount > 0 && (
            <Badge variant="secondary" className="ml-2">{lowStockCount}</Badge>
          )}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>상품명</TableHead>
              <TableHead className="text-right">현재 수량</TableHead>
              <TableHead className="text-right">기준치</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">최근 업데이트</TableHead>
              {canEdit && <TableHead className="text-right">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-12 text-muted-foreground">
                  재고 데이터가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const isLow = item.current_qty <= item.low_stock_threshold
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          {item.sku && <p className="text-xs text-muted-foreground">{item.sku}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={isLow ? 'text-destructive font-semibold' : ''}>
                        {formatNumber(item.current_qty)}
                      </span>
                      <span className="text-muted-foreground ml-1">{item.unit}</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatNumber(item.low_stock_threshold)} {item.unit}
                    </TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          부족
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">정상</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(item.last_updated).toLocaleString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: 'Asia/Ho_Chi_Minh'
                      })}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAdjustDialog({ open: true, item })
                            setAdjustForm({ type: 'in', qty: 0, reason: '' })
                          }}
                        >
                          조정
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Adjust Dialog */}
      <Dialog open={adjustDialog.open} onOpenChange={(open) => setAdjustDialog({ open, item: open ? adjustDialog.item : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>재고 조정 - {adjustDialog.item?.product_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">현재 수량:</span>
              <span className="font-semibold">{adjustDialog.item?.current_qty} {adjustDialog.item?.unit}</span>
            </div>
            <div>
              <Label>조정 유형</Label>
              <Select value={adjustForm.type} onValueChange={(v) => setAdjustForm(prev => ({ ...prev, type: v as InventoryMovementType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">입고 (+)</SelectItem>
                  <SelectItem value="out">출고 (-)</SelectItem>
                  <SelectItem value="adjust">재고 조정</SelectItem>
                  <SelectItem value="waste">폐기</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>수량</Label>
              <Input
                type="number"
                min={1}
                value={adjustForm.qty || ''}
                onChange={(e) => setAdjustForm(prev => ({ ...prev, qty: parseInt(e.target.value) || 0 }))}
                placeholder="조정 수량"
              />
            </div>
            <div>
              <Label>사유</Label>
              <Textarea
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="조정 사유를 입력하세요"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog({ open: false, item: null })}>취소</Button>
            <Button onClick={handleAdjust} disabled={adjustForm.qty <= 0 || isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
