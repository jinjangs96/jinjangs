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
import { useAdminLocale } from '@/lib/admin-locale-context'
import { getAdminLabel, ADMIN_INVENTORY_LABELS, ADMIN_COMMON_LABELS } from '@/lib/admin-i18n'

function formatNumber(n: number, locale: 'ko' | 'vi') {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'ko-KR').format(n)
}

function formatDate(iso: string, locale: 'ko' | 'vi') {
  const localeTag = locale === 'vi' ? 'vi-VN' : 'ko-KR'
  return new Date(iso).toLocaleString(localeTag, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
}

export default function InventoryPage() {
  const { locale } = useAdminLocale()
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
      toast.error(result.error || getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'load_failed'))
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
        toast.error(result.error || getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'adjust_failed'))
        return
      }

      toast.success(getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'adjust_success').replace('{name}', adjustDialog.item.product_name))
      setAdjustDialog({ open: false, item: null })
      setAdjustForm({ type: 'in', qty: 0, reason: '' })
      await loadInventory()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'adjust_error'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'page_title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'page_subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inventory/movements">
            <Button variant="outline" size="sm">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              {getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'movements_link')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'total_items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'total_stock')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalItems, locale)}</p>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'low_stock_items')}
              {lowStockCount > 0 && <AlertTriangle className="w-4 h-4 text-destructive" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-destructive' : ''}`}>{lowStockCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'today_changes')}</CardTitle>
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
            placeholder={getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'search_placeholder')}
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
          {getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'low_stock_only')}
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
              <TableHead>{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'col_product')}</TableHead>
              <TableHead className="text-right">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'col_qty')}</TableHead>
              <TableHead className="text-right">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'col_threshold')}</TableHead>
              <TableHead>{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'col_status')}</TableHead>
              <TableHead className="text-right">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'col_updated')}</TableHead>
              {canEdit && <TableHead className="text-right">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'col_action')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-12 text-muted-foreground">
                  {getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'empty')}
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
                        {formatNumber(item.current_qty, locale)}
                      </span>
                      <span className="text-muted-foreground ml-1">{item.unit}</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatNumber(item.low_stock_threshold, locale)} {item.unit}
                    </TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'status_low')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'status_ok')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDate(item.last_updated, locale)}
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
                          {getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'adjust')}
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
            <DialogTitle>{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'adjust_dialog_title')} - {adjustDialog.item?.product_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'current_qty')}:</span>
              <span className="font-semibold">{adjustDialog.item?.current_qty} {adjustDialog.item?.unit}</span>
            </div>
            <div>
              <Label>{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'adjust_type')}</Label>
              <Select value={adjustForm.type} onValueChange={(v) => setAdjustForm(prev => ({ ...prev, type: v as InventoryMovementType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'type_in')}</SelectItem>
                  <SelectItem value="out">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'type_out')}</SelectItem>
                  <SelectItem value="adjust">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'type_adjust')}</SelectItem>
                  <SelectItem value="waste">{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'type_waste')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'qty')}</Label>
              <Input
                type="number"
                min={1}
                value={adjustForm.qty || ''}
                onChange={(e) => setAdjustForm(prev => ({ ...prev, qty: parseInt(e.target.value) || 0 }))}
                placeholder={getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'qty_placeholder')}
              />
            </div>
            <div>
              <Label>{getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'reason')}</Label>
              <Textarea
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder={getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'reason_placeholder')}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog({ open: false, item: null })}>{getAdminLabel(locale, ADMIN_COMMON_LABELS, 'cancel')}</Button>
            <Button onClick={handleAdjust} disabled={adjustForm.qty <= 0 || isSaving}>
              {isSaving ? getAdminLabel(locale, ADMIN_INVENTORY_LABELS, 'saving') : getAdminLabel(locale, ADMIN_COMMON_LABELS, 'save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
