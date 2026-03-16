import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

type ManualOrderItem = {
  product_name: string
  quantity: number
  unit_price_vnd: number
}

type Body = {
  customer_name?: string
  customer_phone?: string
  district?: string
  address_line1?: string
  payment_method?: 'bank_transfer' | 'qr_transfer' | 'cod' | 'megapay'
  items?: ManualOrderItem[]
  note?: string
}

export async function POST(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'orders.create')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  try {
    const body = (await request.json()) as Body
    if (!body.customer_name?.trim() || !body.customer_phone?.trim() || !body.district?.trim() || !body.address_line1?.trim()) {
      return NextResponse.json({ error: '고객/주소 정보가 필요합니다.' }, { status: 400 })
    }
    if (!body.items?.length) return NextResponse.json({ error: '주문 상품이 필요합니다.' }, { status: 400 })

    const paymentMethod = body.payment_method || 'cod'
    const subtotal = body.items.reduce((sum, item) => sum + item.unit_price_vnd * item.quantity, 0)

    const admin = getSupabaseAdminClient()
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        source_channel: 'manual_offline',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'transfer_waiting',
        order_status: 'new',
        customer_name: body.customer_name.trim(),
        customer_phone: body.customer_phone.trim(),
        district: body.district.trim(),
        address_line1: body.address_line1.trim(),
        subtotal_vnd: subtotal,
        delivery_fee_vnd: 0,
        discount_vnd: 0,
        total_vnd: subtotal,
        internal_note: body.note?.trim() || null,
        created_by: auth.userId,
      })
      .select('id,order_number')
      .single()
    if (orderError || !order) return NextResponse.json({ error: orderError?.message || '수동 주문 생성 실패' }, { status: 400 })

    const itemRows = body.items.map((item) => ({
      order_id: order.id,
      product_name_snapshot: item.product_name,
      unit_price_vnd: item.unit_price_vnd,
      quantity: item.quantity,
      line_total_vnd: item.unit_price_vnd * item.quantity,
    }))

    const { error: itemError } = await admin.from('order_items').insert(itemRows)
    if (itemError) return NextResponse.json({ error: itemError.message }, { status: 400 })

    const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'transfer_waiting'
    const { error: paymentError } = await admin.from('payments').insert({
      order_id: order.id,
      method: paymentMethod,
      expected_amount_vnd: subtotal,
      payment_status: paymentStatus,
    })
    if (paymentError) return NextResponse.json({ error: paymentError.message || '결제 정보 생성에 실패했습니다.' }, { status: 400 })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    const message = error instanceof Error ? error.message : '수동 주문 생성 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
