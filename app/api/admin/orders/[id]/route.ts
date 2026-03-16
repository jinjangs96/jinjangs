import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'orders.view')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  try {
    const { id } = await context.params
    const admin = getSupabaseAdminClient()

    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 400 })
    if (!order) return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })

    const { data: orderItems, error: itemError } = await admin
      .from('order_items')
      .select('*')
      .eq('order_id', id)
    if (itemError) return NextResponse.json({ error: itemError.message }, { status: 400 })

    const itemIds = (orderItems ?? []).map((item) => item.id)
    const { data: optionSelections, error: optionError } = itemIds.length
      ? await admin
          .from('order_item_option_selections')
          .select('*')
          .in('order_item_id', itemIds)
      : { data: [], error: null as null | { message: string } }
    if (optionError) return NextResponse.json({ error: optionError.message }, { status: 400 })

    const { data: history, error: historyError } = await admin
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true })
    if (historyError) return NextResponse.json({ error: historyError.message }, { status: 400 })

    return NextResponse.json({
      success: true,
      order,
      items: orderItems ?? [],
      optionSelections: optionSelections ?? [],
      statusHistory: history ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '주문 상세 조회 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
