import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

export async function GET(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'inventory.view')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  try {
    const admin = getSupabaseAdminClient()
    const [{ data: items, error: itemError }, { data: movements, error: movementError }, { data: products }] =
      await Promise.all([
        admin.from('inventory_items').select('*'),
        admin.from('inventory_movements').select('*').order('created_at', { ascending: false }).limit(500),
        admin.from('products').select('id,slug,title'),
      ])

    if (itemError) return NextResponse.json({ error: itemError.message }, { status: 400 })
    if (movementError) return NextResponse.json({ error: movementError.message }, { status: 400 })

    const productMap = new Map((products ?? []).map((product) => {
      const title = product.title as Record<string, string> | null
      const name = title?.ko || title?.vi || title?.en || product.slug || product.id
      return [product.id, name]
    }))

    const mappedItems = (items ?? []).map((item) => ({
      id: String(item.product_id),
      product_id: String(item.product_id),
      product_name: productMap.get(item.product_id) || String(item.product_id).slice(0, 8),
      sku: null,
      current_qty: Number(item.current_stock ?? 0),
      unit: 'ea',
      low_stock_threshold: Number(item.low_stock_threshold ?? 0),
      last_updated: String(item.updated_at ?? new Date().toISOString()),
    }))

    const createdByIds = Array.from(
      new Set((movements ?? []).map((m) => String((m as { created_by?: unknown }).created_by ?? '')).filter(Boolean))
    )
    const { data: profiles, error: profileError } = createdByIds.length
      ? await admin.from('profiles').select('id,full_name,email').in('id', createdByIds)
      : { data: [], error: null as null | { message: string } }
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })
    const profileMap = new Map((profiles ?? []).map((p) => [String(p.id), p]))

    const movementsWithHandler = (movements ?? []).map((m) => {
      const id = String((m as { created_by?: unknown }).created_by ?? '')
      const profile = profileMap.get(id)
      const handler_name = profile?.full_name || profile?.email || null
      return { ...m, handler_name }
    })

    return NextResponse.json({
      success: true,
      items: mappedItems,
      movements: movementsWithHandler,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '재고 조회 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
