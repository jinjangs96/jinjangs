import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

export async function GET(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'orders.view')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  try {
    const admin = getSupabaseAdminClient()
    const { data: orders, error } = await admin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const rows = orders ?? []
    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      const key = String(row.order_status ?? 'new')
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      counts,
      orders: rows,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '주문 조회 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
