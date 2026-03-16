'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminReportsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader><CardTitle>리포트</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>월별 주문량/매출과 상품별 매출 분석으로 이동할 수 있습니다.</p>
          <div className="flex gap-3">
            <Link href="/admin/reports/monthly" className="underline text-primary">월별 리포트</Link>
            <Link href="/admin/reports/products" className="underline text-primary">상품 리포트</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
