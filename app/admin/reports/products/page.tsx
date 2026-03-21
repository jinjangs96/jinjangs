'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_REPORTS_LABELS, getAdminLabel } from '@/lib/admin-i18n'

type Row = { product_name: string; qty: number; revenue: number }

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

export default function AdminReportsProductsPage() {
  const { locale } = useAdminLocale()
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    async function loadRows() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token ?? ''
        const response = await fetch('/api/admin/reports/products', { headers: { Authorization: `Bearer ${token}` } })
        const result = (await response.json()) as { error?: string; products?: Row[] }
        if (!response.ok) {
          toast.error(result.error || getAdminLabel(locale, ADMIN_REPORTS_LABELS, 'load_failed'))
          return
        }
        setRows(result.products ?? [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : getAdminLabel(locale, ADMIN_REPORTS_LABELS, 'load_error'))
      }
    }
    loadRows()
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader><CardTitle>{getAdminLabel(locale, ADMIN_REPORTS_LABELS, 'products_title')}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {rows.length === 0 ? <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_REPORTS_LABELS, 'empty')}</p> : rows.map((row) => (
            <div key={row.product_name} className="border rounded-md p-3">
              <p className="font-medium">{row.product_name}</p>
              <p>{getAdminLabel(locale, ADMIN_REPORTS_LABELS, 'sold_units_format').replace('{n}', String(row.qty))}</p>
              <p>{getAdminLabel(locale, ADMIN_REPORTS_LABELS, 'revenue')} {formatVND(row.revenue)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
