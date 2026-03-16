import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

type TrackOrderBody = {
  order_number?: string
  customer_phone?: string
}

const ORDER_SELECT_FIELDS =
  'id,order_number,tracking_code,order_status,payment_status,total_vnd,created_at'
const ORDER_ITEMS_SELECT_FIELDS = 'id,product_name_snapshot,quantity'
const ORDER_STATUS_HISTORY_SELECT_FIELDS = 'id,to_status,note,created_at'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TrackOrderBody
    const orderNumber = body.order_number?.trim()
    const phone = body.customer_phone?.trim()

    if (!orderNumber || !phone) {
      return NextResponse.json({ error: '주문번호와 전화번호를 입력해주세요.' }, { status: 400 })
    }

    const admin = getSupabaseAdminClient()

    let orderQuery = await admin
      .from('orders')
      .select(ORDER_SELECT_FIELDS)
      .eq('order_number', orderNumber)
      .eq('customer_phone', phone)
      .maybeSingle()

    if (!orderQuery.data) {
      orderQuery = await admin
        .from('orders')
        .select(ORDER_SELECT_FIELDS)
        .eq('order_number', orderNumber)
        .eq('recipient_phone', phone)
        .maybeSingle()
    }

    if (orderQuery.error) {
      return NextResponse.json({ error: orderQuery.error.message }, { status: 400 })
    }

    if (!orderQuery.data) {
      return NextResponse.json({ error: '일치하는 주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    const [itemsResult, statusResult] = await Promise.all([
      admin
        .from('order_items')
        .select(ORDER_ITEMS_SELECT_FIELDS)
        .eq('order_id', orderQuery.data.id),
      admin
        .from('order_status_history')
        .select(ORDER_STATUS_HISTORY_SELECT_FIELDS)
        .eq('order_id', orderQuery.data.id)
        .order('created_at', { ascending: false }),
    ])

    const order = orderQuery.data
    return NextResponse.json({
      success: true,
      order: {
        order_number: order.order_number,
        tracking_code: order.tracking_code,
        order_status: order.order_status,
        payment_status: order.payment_status,
        total_vnd: order.total_vnd,
        created_at: order.created_at,
      },
      items: (itemsResult.data ?? []).map((item) => ({
        id: item.id,
        product_name_snapshot: item.product_name_snapshot,
        quantity: item.quantity,
      })),
      status_history: (statusResult.data ?? []).map((history) => ({
        id: history.id,
        to_status: history.to_status,
        note: history.note,
        created_at: history.created_at,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '주문 조회 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
