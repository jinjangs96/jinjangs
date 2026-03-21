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
import { useAdminLocale } from '@/lib/admin-locale-context'
import { getAdminLabel, ADMIN_MOVEMENTS_LABELS, ADMIN_COMMON_LABELS } from '@/lib/admin-i18n'

type MovementTypeKey = InventoryMovementType | 'sale' | 'manual_adjustment' | 'cancel_restore' | 'spoilage' | 'restock' | string

type TypeConfig = { labelKey: string; icon: React.ComponentType<{ className?: string }>; color: string }

const TYPE_CONFIG: Record<string, TypeConfig> = {
  in: { labelKey: 'type_in', icon: ArrowUpCircle, color: 'text-green-600' },
  out: { labelKey: 'type_out', icon: ArrowDownCircle, color: 'text-orange-600' },
  adjust: { labelKey: 'type_adjust', icon: RefreshCw, color: 'text-blue-600' },
  waste: { labelKey: 'type_waste', icon: Trash2, color: 'text-destructive' },
  order_deduct: { labelKey: 'type_order_deduct', icon: ShoppingBag, color: 'text-primary' },
  sale: { labelKey: 'type_sale', icon: ShoppingBag, color: 'text-primary' },
  manual_adjustment: { labelKey: 'type_manual', icon: RefreshCw, color: 'text-blue-600' },
  cancel_restore: { labelKey: 'type_cancel_restore', icon: ArrowUpCircle, color: 'text-green-600' },
  spoilage: { labelKey: 'type_spoilage', icon: Trash2, color: 'text-destructive' },
  restock: { labelKey: 'type_restock', icon: ArrowUpCircle, color: 'text-green-600' },
}

const FALLBACK_TYPE: TypeConfig = TYPE_CONFIG.manual_adjustment

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

export default function InventoryMovementsPage() {
  type Movement = Omit<InventoryMovement, 'type'> & { type: MovementTypeKey }
  const { locale } = useAdminLocale()
  const [movements, setMovements] = useState<Movement[]>([])
  const [itemsByProductId, setItemsByProductId] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<MovementTypeKey | 'all'>('all')

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
          toast.error(result.error || getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'load_failed'))
          return
        }

        const map: Record<string, string> = {}
        for (const item of result.items ?? []) map[item.product_id] = item.product_name
        setItemsByProductId(map)

        const mappedMovements: Movement[] = (result.movements ?? []).map((row) => ({
          id: String(row.id),
          inventory_item_id: String(row.product_id),
          product_id: String(row.product_id),
          type: String(row.movement_type ?? 'manual_adjustment'),
          qty_change: Number(row.quantity_delta ?? 0),
          qty_before: 0,
          qty_after: Number((row as { stock_after?: unknown }).stock_after ?? 0),
          reason: String(row.note ?? row.reference_type ?? '-'),
          order_id: row.reference_id ? String(row.reference_id) : undefined,
          created_by: String((row as { handler_name?: unknown }).handler_name ?? row.created_by ?? 'system'),
          created_at: String(row.created_at ?? new Date().toISOString()),
        }))
        setMovements(mappedMovements)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'load_failed'))
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
            <h1 className="text-2xl font-bold text-foreground">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'page_title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'page_subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'today_in')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">+{todayIn}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'today_out')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">-{todayOut}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'today_count')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayMovements.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'total_count')}</CardTitle>
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
            placeholder={getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as InventoryMovementType | 'all')}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder={getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'type_filter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{getAdminLabel(locale, ADMIN_COMMON_LABELS, 'all')}</SelectItem>
            <SelectItem value="in">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'type_in')}</SelectItem>
            <SelectItem value="out">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'type_out')}</SelectItem>
            <SelectItem value="adjust">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'type_adjust')}</SelectItem>
            <SelectItem value="waste">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'type_waste')}</SelectItem>
            <SelectItem value="order_deduct">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'type_order_deduct')}</SelectItem>
            <SelectItem value="sale">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'type_sale')}</SelectItem>
            <SelectItem value="manual_adjustment">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'type_manual')}</SelectItem>
            <SelectItem value="cancel_restore">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'type_cancel_restore')}</SelectItem>
            <SelectItem value="spoilage">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'type_spoilage')}</SelectItem>
            <SelectItem value="restock">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'type_restock')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'col_date')}</TableHead>
              <TableHead>{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'col_product')}</TableHead>
              <TableHead>{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'col_type')}</TableHead>
              <TableHead className="text-right">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'col_change')}</TableHead>
              <TableHead className="text-right">{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'col_after')}</TableHead>
              <TableHead>{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'col_reason')}</TableHead>
              <TableHead>{getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'col_handler')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, 'empty')}
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((mov) => {
                const config = TYPE_CONFIG[String(mov.type)] ?? FALLBACK_TYPE
                const Icon = config.icon
                return (
                  <TableRow key={mov.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(mov.created_at, locale)}
                    </TableCell>
                    <TableCell className="font-medium">{getProductName(mov.product_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        <Icon className={`w-3 h-3 mr-1 ${config.color}`} />
                        {getAdminLabel(locale, ADMIN_MOVEMENTS_LABELS, config.labelKey)}
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
