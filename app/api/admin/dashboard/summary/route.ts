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
      .select('id,order_number,created_at,customer_name,customer_phone,total_vnd,payment_method,order_status,district')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const rows = orders ?? []
    const today = new Date().toDateString()
    const todayRows = rows.filter((row) => new Date(String(row.created_at)).toDateString() === today)
    const todayRevenue = todayRows
      .filter((row) => String(row.order_status) === 'completed')
      .reduce((sum, row) => sum + Number(row.total_vnd ?? 0), 0)

    const counts = {
      newCount: rows.filter((row) => String(row.order_status) === 'new').length,
      inProgressCount: rows.filter((row) =>
        ['accepted', 'preparing', 'packed', 'out_for_delivery'].includes(String(row.order_status))
      ).length,
      completedCount: rows.filter((row) => String(row.order_status) === 'completed').length,
      canceledCount: rows.filter((row) => String(row.order_status) === 'canceled').length,
      failedEmails: 0,
      todayRevenue,
    }

    const recentOrders = rows.slice(0, 5)
    return NextResponse.json({ success: true, counts, recentOrders })
  } catch (error) {
    const message = error instanceof Error ? error.message : '대시보드 조회 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
