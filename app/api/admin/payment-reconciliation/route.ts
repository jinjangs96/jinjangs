import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

const ALLOWED_STATUSES = ['paid', 'failed', 'refunded'] as const
type AllowedStatus = (typeof ALLOWED_STATUSES)[number]

export async function GET(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'payments.view')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  try {
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin
      .from('payments')
      .select('*, orders(order_number,customer_name,customer_phone,total_vnd)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, payments: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : '결제 내역 조회 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

type PostBody = { payment_id?: string; to_status?: string; note?: string }

export async function POST(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'payments.confirm')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  try {
    const body = (await request.json()) as PostBody
    const paymentId = body.payment_id?.trim()
    const toStatus = body.to_status?.trim()
    if (!paymentId || !toStatus) {
      return NextResponse.json({ error: 'payment_id와 to_status가 필요합니다.' }, { status: 400 })
    }
    if (!ALLOWED_STATUSES.includes(toStatus as AllowedStatus)) {
      return NextResponse.json({ error: 'to_status는 paid, failed, refunded 중 하나여야 합니다.' }, { status: 400 })
    }

    const admin = getSupabaseAdminClient()
    const { data: payment, error: fetchError } = await admin
      .from('payments')
      .select('id, order_id, payment_status')
      .eq('id', paymentId)
      .maybeSingle()
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 })
    if (!payment) return NextResponse.json({ error: '결제 정보를 찾을 수 없습니다.' }, { status: 404 })

    const fromStatus = payment.payment_status as string
    const updatePayload: Record<string, unknown> = {
      payment_status: toStatus,
      updated_at: new Date().toISOString(),
    }
    if (toStatus === 'paid') {
      updatePayload.confirmed_by = auth.userId
      updatePayload.confirmed_at = new Date().toISOString()
      if (body.note?.trim()) updatePayload.note = body.note.trim()
    }

    const { error: updateError } = await admin
      .from('payments')
      .update(updatePayload)
      .eq('id', paymentId)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    const { error: eventError } = await admin.from('payment_events').insert({
      payment_id: paymentId,
      from_status: fromStatus,
      to_status: toStatus,
      note: body.note?.trim() || null,
      changed_by: auth.userId,
    })
    if (eventError) return NextResponse.json({ error: eventError.message }, { status: 400 })

    if (toStatus === 'paid') {
      await admin
        .from('orders')
        .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', payment.order_id)
    } else if (toStatus === 'failed') {
      await admin
        .from('orders')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', payment.order_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '결제 상태 변경 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
