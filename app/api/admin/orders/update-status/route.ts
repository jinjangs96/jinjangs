import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

type Body = {
  orderId?: string
  toStatus?: string
  note?: string
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new: ['accepted', 'canceled'],
  accepted: ['preparing', 'canceled'],
  preparing: ['out_for_delivery', 'canceled'],
  out_for_delivery: ['completed', 'canceled'],
  completed: [],
  canceled: [],
}

async function checkInventoryForOrder(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  orderId: string
) {
  const { data: items, error: itemError } = await admin
    .from('order_items')
    .select('product_id, quantity, product_name_snapshot')
    .eq('order_id', orderId)

  if (itemError) {
    return { ok: false as const, error: itemError.message }
  }

  const shortages: string[] = []

  for (const item of items ?? []) {
    const productId = item.product_id
    const qty = Number(item.quantity ?? 0)
    if (!productId || !qty || qty <= 0) continue

    const { data: current, error: currentError } = await admin
      .from('inventory_items')
      .select('current_stock')
      .eq('product_id', productId)
      .maybeSingle()
    if (currentError) {
      return { ok: false as const, error: currentError.message }
    }

    const currentStock = Number(current?.current_stock ?? 0)
    if (currentStock < qty) {
      const name = String(item.product_name_snapshot ?? '').trim() || '해당 상품'
      const shortage = qty - currentStock
      shortages.push(
        `${name}: 재고 부족 [필요 ${qty}개 / 현재 ${currentStock}개 / 부족 ${shortage}개]`
      )
    }
  }

  if (shortages.length > 0) {
    return {
      ok: false as const,
      error: '재고가 부족합니다.',
      detail: shortages.join('\n'),
    }
  }

  return { ok: true as const }
}

async function applyInventoryForOrder(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  orderId: string,
  userId: string
) {
  const { error } = await admin.rpc('apply_inventory_for_order', {
    p_order_id: orderId,
    p_actor: userId ?? null,
  })

  if (error) {
    return {
      ok: false as const,
      error: error.message || '재고 차감 중 오류가 발생했습니다.',
      detail: error.details || null,
    }
  }

  return { ok: true as const }
}

async function restoreInventoryForOrder(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  orderId: string,
  userId: string
) {
  const { data: items, error: itemError } = await admin
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  if (itemError) {
    return { ok: false as const, error: itemError.message }
  }

  for (const item of items ?? []) {
    const productId = item.product_id
    const qty = Number(item.quantity ?? 0)
    if (!productId || !qty || qty <= 0) continue

    const { data: current, error: currentError } = await admin
      .from('inventory_items')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle()
    if (currentError) {
      return { ok: false as const, error: currentError.message }
    }

    const currentStock = Number(current?.current_stock ?? 0)
    const nextStock = currentStock + qty

    const { error: upsertError } = await admin.from('inventory_items').upsert({
      product_id: productId,
      current_stock: nextStock,
      low_stock_threshold: Number(current?.low_stock_threshold ?? 0),
      updated_at: new Date().toISOString(),
    })
    if (upsertError) {
      return { ok: false as const, error: upsertError.message }
    }

    const { error: movementError } = await admin.from('inventory_movements').insert({
      product_id: productId,
      movement_type: 'cancel_restore',
      quantity_delta: qty,
      reference_type: 'order',
      reference_id: orderId,
      note: null,
      created_by: userId,
    })
    if (movementError) {
      return { ok: false as const, error: movementError.message }
    }
  }

  return { ok: true as const }
}

export async function POST(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'orders.edit')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  try {
    const body = (await request.json()) as Body
    const orderId = body.orderId?.trim()
    const toStatus = body.toStatus?.trim()
    const note = body.note?.trim() ?? ''
    if (!orderId || !toStatus) {
      return NextResponse.json({ error: 'orderId와 toStatus가 필요합니다.' }, { status: 400 })
    }

    const admin = getSupabaseAdminClient()
    const { data: before, error: beforeError } = await admin
      .from('orders')
      .select('order_status, inventory_applied')
      .eq('id', orderId)
      .maybeSingle()
    if (beforeError) return NextResponse.json({ error: beforeError.message }, { status: 400 })
    if (!before) {
      return NextResponse.json({ error: '해당 주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    const currentStatus = String(before.order_status ?? '')
    const inventoryApplied = Boolean(before.inventory_applied)
    const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] ?? []

    if (!allowedTargets.includes(toStatus)) {
      return NextResponse.json(
        {
          error: `허용되지 않은 상태 전환입니다. 현재 상태: ${currentStatus}, 요청 상태: ${toStatus}`,
        },
        { status: 400 }
      )
    }

    if (toStatus === 'canceled' && note.length === 0) {
      return NextResponse.json({ error: '주문을 취소할 때는 취소 사유를 입력해야 합니다.' }, { status: 400 })
    }

    const shouldApplyInventory = toStatus === 'preparing' && !inventoryApplied
    const shouldRestoreInventory = toStatus === 'canceled' && inventoryApplied

  if (shouldApplyInventory) {
    const check = await checkInventoryForOrder(admin, orderId)
    if (!check.ok) {
      return NextResponse.json(
        {
          error: check.error || '재고가 부족하여 준비 상태로 변경할 수 없습니다.',
          detail: 'detail' in check ? (check as { detail?: string }).detail : undefined,
        },
        { status: 400 }
      )
    }
  }

    if (shouldApplyInventory) {
    const result = await applyInventoryForOrder(admin, orderId, auth.userId)
    if (!result.ok) {
      if (result.error === 'INSUFFICIENT_INVENTORY') {
        return NextResponse.json(
          {
            error: '재고가 부족합니다.',
            detail: (result as { detail?: string | null }).detail || null,
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || '재고 차감 중 오류가 발생했습니다.' },
        { status: 400 }
      )
    }
    }

    if (shouldRestoreInventory) {
      const result = await restoreInventoryForOrder(admin, orderId, auth.userId)
      if (!result.ok) {
        return NextResponse.json({ error: result.error || '재고 복구 중 오류가 발생했습니다.' }, { status: 400 })
      }
    }

    const orderUpdate: Record<string, unknown> = { order_status: toStatus }
    if (shouldApplyInventory) orderUpdate.inventory_applied = true
    if (shouldRestoreInventory) orderUpdate.inventory_applied = false

    const { error: updateError } = await admin.from('orders').update(orderUpdate).eq('id', orderId)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    const { error: historyError } = await admin.from('order_status_history').insert({
      order_id: orderId,
      from_status: currentStatus,
      to_status: toStatus,
      note: note || null,
      changed_by: auth.userId,
    })
    if (historyError) return NextResponse.json({ error: historyError.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '주문 상태 변경 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
