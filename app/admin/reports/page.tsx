'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_REPORTS_LABELS, getAdminLabel } from '@/lib/admin-i18n'

export default function AdminReportsPage() {
  const { locale } = useAdminLocale()
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader><CardTitle>{getAdminLabel(locale, ADMIN_REPORTS_LABELS, 'page_title')}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{getAdminLabel(locale, ADMIN_REPORTS_LABELS, 'intro')}</p>
          <div className="flex gap-3">
            <Link href="/admin/reports/monthly" className="underline text-primary">{getAdminLabel(locale, ADMIN_REPORTS_LABELS, 'link_monthly')}</Link>
            <Link href="/admin/reports/products" className="underline text-primary">{getAdminLabel(locale, ADMIN_REPORTS_LABELS, 'link_products')}</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
