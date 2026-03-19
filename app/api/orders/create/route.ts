import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseAnonServerClient } from '@/lib/supabase/admin'

type CheckoutItemOption = {
  group_name: string
  option_name: string
  price_delta_vnd: number
  quantity?: number
}

type CheckoutItem = {
  product_id: string
  product_name: string
  base_price_vnd: number
  quantity: number
  selected_options: CheckoutItemOption[]
}

type CreateOrderBody = {
  customer_name: string
  customer_phone: string
  recipient_name?: string
  recipient_phone?: string
  district: string
  ward?: string
  address_line1: string
  address_line2?: string
  delivery_note?: string
  payment_method: 'bank_transfer' | 'qr_transfer' | 'cod' | 'megapay'
  subtotal_vnd: number
  delivery_fee_vnd: number
  total_vnd: number
  items: CheckoutItem[]
  source_channel?: 'website'
  save_address?: boolean
  address_label?: 'home' | 'office' | 'other'
}

type ProductOptionValueSnapshot = {
  name_ko?: unknown
  name?: unknown
  is_available?: unknown
  is_sold_out?: unknown
  sold_out?: unknown
}

type ProductOptionGroupSnapshot = {
  name_ko?: unknown
  name?: unknown
  option_values?: unknown
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function stripQtySuffix(input: string): string {
  return input.replace(/\s+x\d+\s*$/i, '').trim()
}

function isSelectionAllowedFromOptionGroups(
  optionGroupsRaw: unknown,
  groupName: string,
  optionName: string
): boolean | null {
  if (!Array.isArray(optionGroupsRaw)) return null

  const groupNameNorm = groupName.trim()
  const optionNameNorm = stripQtySuffix(optionName).trim()

  for (const gRaw of optionGroupsRaw) {
    if (!gRaw || typeof gRaw !== 'object') continue
    const g = gRaw as ProductOptionGroupSnapshot
    const gName = text(g.name_ko ?? g.name).trim()
    if (!gName || gName !== groupNameNorm) continue

    const valuesRaw = (g as { option_values?: unknown }).option_values
    if (!Array.isArray(valuesRaw)) return null
    for (const vRaw of valuesRaw) {
      if (!vRaw || typeof vRaw !== 'object') continue
      const v = vRaw as ProductOptionValueSnapshot
      const vName = text(v.name_ko ?? v.name).trim()
      if (!vName || vName !== optionNameNorm) continue
      const isAvailable = v.is_available
      const isSoldOut = v.is_sold_out ?? v.sold_out
      const blocked = isAvailable === false || isSoldOut === true
      return !blocked
    }
    return null
  }

  return null
}

async function getOptionalUserIdFromAuthHeader(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) return null

  const anonClient = getSupabaseAnonServerClient()
  const { data, error } = await anonClient.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

/** JJK + YYMMDD(Asia/Ho_Chi_Minh) + '-' + 4자리 숫자. 예: JJK250319-4821 */
function generateOrderNumber(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const y = parts.find((p) => p.type === 'year')?.value ?? '25'
  const m = parts.find((p) => p.type === 'month')?.value ?? '01'
  const d = parts.find((p) => p.type === 'day')?.value ?? '01'
  const yymmdd = `${y}${m}${d}`
  const four = Math.floor(1000 + Math.random() * 9000)
  return `JJK${yymmdd}-${four}`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody

    if (!body.customer_name?.trim() || !body.customer_phone?.trim() || !body.address_line1?.trim()) {
      return NextResponse.json({ error: '주문자/주소 정보가 부족합니다.' }, { status: 400 })
    }

    const district = body.district?.trim() || '미정'
    const existingNote = body.delivery_note?.trim() || ''
    const deliveryNote = existingNote
      ? `${existingNote}\n[배송비 별도 / Grab 실비 기준]`
      : '[배송비 별도 / Grab 실비 기준]'

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: '주문 상품이 없습니다.' }, { status: 400 })
    }

    const paymentMethod = body.payment_method
    if (!['bank_transfer', 'qr_transfer', 'cod', 'megapay'].includes(paymentMethod)) {
      return NextResponse.json({ error: '지원하지 않는 결제 방식입니다.' }, { status: 400 })
    }

    const userId = await getOptionalUserIdFromAuthHeader(request.headers.get('authorization'))
    const admin = getSupabaseAdminClient()

    // Final validation: block inactive products / sold-out options
    const productIds = Array.from(
      new Set((body.items ?? []).map((item) => String(item.product_id ?? '')).filter(Boolean))
    )
    if (productIds.length > 0) {
      const { data: productRows, error: productErr } = await admin
        .from('products')
        .select('id,is_active,option_groups')
        .in('id', productIds)
      if (productErr) {
        return NextResponse.json({ error: productErr.message }, { status: 400 })
      }
      const productById = new Map(
        (productRows ?? []).map((row) => [String((row as { id?: unknown }).id ?? ''), row as Record<string, unknown>])
      )

      for (const item of body.items ?? []) {
        const pid = String(item.product_id ?? '')
        if (!pid) continue
        const row = productById.get(pid)
        if (!row) {
          return NextResponse.json(
            { error: '품절된 상품 또는 옵션이 포함되어 있습니다. 장바구니를 다시 확인해주세요.' },
            { status: 400 }
          )
        }
        if (row.is_active === false) {
          return NextResponse.json(
            { error: '품절된 상품 또는 옵션이 포함되어 있습니다. 장바구니를 다시 확인해주세요.' },
            { status: 400 }
          )
        }

        for (const opt of item.selected_options ?? []) {
          const allowed = isSelectionAllowedFromOptionGroups(row.option_groups, opt.group_name, opt.option_name)
          if (allowed === false || allowed === null) {
            return NextResponse.json(
              { error: '품절된 상품 또는 옵션이 포함되어 있습니다. 장바구니를 다시 확인해주세요.' },
              { status: 400 }
            )
          }
        }
      }
    }

    const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'transfer_waiting'

    const maxOrderNumberAttempts = 3
    let orderRow: { id: string; order_number: string; tracking_code: string; order_status: string; payment_status: string; total_vnd: number } | null = null
    let lastError: { message?: string; code?: string } | null = null

    for (let attempt = 0; attempt < maxOrderNumberAttempts; attempt++) {
      const order_number = generateOrderNumber()
      const { data: row, error: err } = await admin
        .from('orders')
        .insert({
          user_id: userId,
          source_channel: body.source_channel || 'website',
          payment_method: paymentMethod,
          order_status: 'new',
          payment_status: paymentStatus,
          customer_name: body.customer_name.trim(),
          customer_phone: body.customer_phone.trim(),
          recipient_name: body.recipient_name?.trim() || null,
          recipient_phone: body.recipient_phone?.trim() || null,
          district,
          ward: body.ward?.trim() || null,
          address_line1: body.address_line1.trim(),
          address_line2: body.address_line2?.trim() || null,
          delivery_note: deliveryNote || null,
          subtotal_vnd: body.subtotal_vnd,
          delivery_fee_vnd: 0,
          discount_vnd: 0,
          total_vnd: body.subtotal_vnd,
          created_by: userId,
          order_number,
        })
        .select('id, order_number, tracking_code, order_status, payment_status, total_vnd')
        .single()

      if (!err && row) {
        orderRow = row
        break
      }
      lastError = err
      const code = (err as { code?: string })?.code ?? ''
      const isUniqueViolation = code === '23505'
      if (!isUniqueViolation || attempt === maxOrderNumberAttempts - 1) break
    }

    if (!orderRow) {
      return NextResponse.json({ error: lastError?.message || '주문 생성에 실패했습니다.' }, { status: 400 })
    }

    const orderId = orderRow.id

    const cleanupOrder = async () => {
      await admin.from('orders').delete().eq('id', orderId)
    }

    for (const item of body.items) {
      const optionsTotal = (item.selected_options || []).reduce(
        (sum, option) => sum + (option.price_delta_vnd || 0) * Math.max(0, Math.floor(option.quantity ?? 1)),
        0
      )
      const unitPrice = item.base_price_vnd + optionsTotal
      const lineTotal = unitPrice * item.quantity

      const { data: orderItemRow, error: itemError } = await admin
        .from('order_items')
        .insert({
          order_id: orderRow.id,
          product_id: item.product_id || null,
          product_name_snapshot: item.product_name,
          unit_price_vnd: unitPrice,
          quantity: item.quantity,
          line_total_vnd: lineTotal,
        })
        .select('id')
        .single()

      if (itemError || !orderItemRow) {
        await cleanupOrder()
        return NextResponse.json({ error: itemError?.message || '주문 상품 저장에 실패했습니다.' }, { status: 400 })
      }

      if (item.selected_options?.length) {
        const optionRows = item.selected_options.map((option) => ({
          quantity: Math.max(1, Math.floor(option.quantity ?? 1)),
          order_item_id: orderItemRow.id,
          option_group_name_snapshot: option.group_name,
          option_value_name_snapshot:
            Math.max(0, Math.floor(option.quantity ?? 1)) > 1
              ? `${option.option_name} x${Math.max(0, Math.floor(option.quantity ?? 1))}`
              : option.option_name,
          price_delta_vnd: option.price_delta_vnd || 0,
        }))

        const { error: optionError } = await admin.from('order_item_option_selections').insert(optionRows)
        if (optionError) {
          // DB에 quantity 컬럼이 아직 없더라도 기존 동작을 깨지 않기 위해 폴백
          const msg = optionError.message || ''
          const looksLikeMissingQuantityColumn =
            msg.includes('column') && msg.includes('quantity') && msg.includes('does not exist')
          if (looksLikeMissingQuantityColumn) {
            const fallbackRows = optionRows.map(({ quantity: _q, ...rest }) => rest)
            const { error: fallbackError } = await admin
              .from('order_item_option_selections')
              .insert(fallbackRows)
            if (fallbackError) {
              await cleanupOrder()
              return NextResponse.json({ error: fallbackError.message }, { status: 400 })
            }
          } else {
            await cleanupOrder()
            return NextResponse.json({ error: optionError.message }, { status: 400 })
          }
        }
      }
    }

    const { data: paymentRow, error: paymentError } = await admin
      .from('payments')
      .insert({
        order_id: orderRow.id,
        method: paymentMethod,
        expected_amount_vnd: body.subtotal_vnd,
        payment_status: paymentStatus,
      })
      .select('id')
      .single()

    if (paymentError || !paymentRow) {
      await cleanupOrder()
      return NextResponse.json({ error: paymentError?.message || '결제 정보 생성에 실패했습니다.' }, { status: 400 })
    }

    const { error: paymentEventError } = await admin.from('payment_events').insert({
      payment_id: paymentRow.id,
      from_status: null,
      to_status: paymentStatus,
      note: 'Checkout created payment',
      changed_by: userId,
    })

    if (paymentEventError) {
      await cleanupOrder()
      return NextResponse.json({ error: paymentEventError.message }, { status: 400 })
    }

    const { error: statusHistoryError } = await admin.from('order_status_history').insert({
      order_id: orderRow.id,
      from_status: null,
      to_status: 'new',
      note: 'Checkout created order',
      changed_by: userId,
    })

    if (statusHistoryError) {
      await cleanupOrder()
      return NextResponse.json({ error: statusHistoryError.message }, { status: 400 })
    }

    if (userId && body.save_address) {
      await admin.from('addresses').insert({
        user_id: userId,
        label: body.address_label || 'home',
        recipient_name: body.recipient_name?.trim() || body.customer_name.trim(),
        recipient_phone: body.recipient_phone?.trim() || body.customer_phone.trim(),
        district,
        ward: body.ward?.trim() || null,
        address_line1: body.address_line1.trim(),
        address_line2: body.address_line2?.trim() || null,
        delivery_note: body.delivery_note?.trim() || null,
        is_default: false,
      })
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderRow.id,
        order_number: orderRow.order_number,
        tracking_code: orderRow.tracking_code,
        order_status: orderRow.order_status,
        payment_status: orderRow.payment_status,
        total_vnd: orderRow.total_vnd,
        is_guest: !userId,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '주문 처리 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
