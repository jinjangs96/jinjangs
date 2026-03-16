import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

type Body = {
  product_id?: string
  movement_type?: 'in' | 'out' | 'adjust' | 'waste'
  quantity?: number
  reason?: string
}

export async function POST(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'inventory.edit')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  try {
    const body = (await request.json()) as Body
    const productId = body.product_id?.trim()
    const movementType = body.movement_type
    const quantity = Number(body.quantity ?? 0)
    if (!productId || !movementType || quantity <= 0) {
      return NextResponse.json({ error: 'product_id, movement_type, quantity가 필요합니다.' }, { status: 400 })
    }

    const delta = movementType === 'in' ? quantity : -quantity
    const dbMovementTypeMap: Record<string, 'restock' | 'manual_adjustment' | 'spoilage'> = {
      in: 'restock',
      out: 'manual_adjustment',
      adjust: 'manual_adjustment',
      waste: 'spoilage',
    }
    const dbMovementType = dbMovementTypeMap[movementType] ?? 'manual_adjustment'

    const admin = getSupabaseAdminClient()

    const { data: current, error: currentError } = await admin
      .from('inventory_items')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle()
    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 400 })

    const currentStock = Number(current?.current_stock ?? 0)
    const nextStock = Math.max(0, currentStock + delta)

    const { error: upsertError } = await admin.from('inventory_items').upsert({
      product_id: productId,
      current_stock: nextStock,
      low_stock_threshold: Number(current?.low_stock_threshold ?? 0),
      updated_at: new Date().toISOString(),
    })
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 })

    const { error: movementError } = await admin.from('inventory_movements').insert({
      product_id: productId,
      movement_type: dbMovementType,
      quantity_delta: delta,
      reference_type: 'manual_adjust',
      reference_id: null,
      note: body.reason?.trim() || null,
      created_by: auth.userId,
    })
    if (movementError) return NextResponse.json({ error: movementError.message }, { status: 400 })

    return NextResponse.json({ success: true, next_stock: nextStock })
  } catch (error) {
    const message = error instanceof Error ? error.message : '재고 조정 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
