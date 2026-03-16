import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

export async function GET(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'reports.view')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('order_items')
    .select('product_name_snapshot,quantity,line_total_vnd,created_at')
    .order('created_at', { ascending: false })
    .limit(5000)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const grouped = new Map<string, { product_name: string; qty: number; revenue: number }>()
  for (const row of data ?? []) {
    const name = String(row.product_name_snapshot || '상품')
    const current = grouped.get(name) ?? { product_name: name, qty: 0, revenue: 0 }
    current.qty += Number(row.quantity ?? 0)
    current.revenue += Number(row.line_total_vnd ?? 0)
    grouped.set(name, current)
  }

  const products = Array.from(grouped.values()).sort((a, b) => b.revenue - a.revenue)
  return NextResponse.json({ success: true, products })
}
