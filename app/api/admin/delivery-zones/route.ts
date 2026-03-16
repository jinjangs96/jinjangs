import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

type ZoneBody = {
  id?: string
  zone_name?: string
  district?: string
  is_active?: boolean
  supports_jang?: boolean
  supports_poke?: boolean
  delivery_fee_vnd?: number
  free_shipping_threshold_vnd?: number | null
  sort_order?: number
}

export async function GET(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'settings.view')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin.from('delivery_zones').select('*').order('sort_order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, zones: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'settings.edit')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })
  try {
    const body = (await request.json()) as ZoneBody
    if (!body.zone_name?.trim() || !body.district?.trim()) {
      return NextResponse.json({ error: 'zone_name, district가 필요합니다.' }, { status: 400 })
    }
    const admin = getSupabaseAdminClient()
    const { error } = await admin.from('delivery_zones').upsert({
      id: body.id,
      zone_name: body.zone_name.trim(),
      district: body.district.trim(),
      is_active: body.is_active ?? true,
      supports_jang: body.supports_jang ?? true,
      supports_poke: body.supports_poke ?? false,
      delivery_fee_vnd: body.delivery_fee_vnd ?? 0,
      free_shipping_threshold_vnd: body.free_shipping_threshold_vnd ?? null,
      sort_order: body.sort_order ?? 0,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '배송구역 저장 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
