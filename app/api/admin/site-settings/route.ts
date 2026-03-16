import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

/** site_settings singleton: id is boolean primary key, only row has id = true */
const SITE_SETTINGS_ID = true

function safeKo(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return ''
  const o = obj as Record<string, unknown>
  const v = o['ko']
  return typeof v === 'string' ? v : ''
}

export async function GET(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(
    request.headers.get('authorization'),
    'settings.view'
  )
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  try {
    const admin = getSupabaseAdminClient()
    const { data: row, error } = await admin
      .from('site_settings')
      .select('*')
      .eq('id', SITE_SETTINGS_ID)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!row) return NextResponse.json({ error: '설정을 찾을 수 없습니다.' }, { status: 404 })

    const r = row as Record<string, unknown>
    const siteName = r.site_name
    const tagline = r.tagline
    const businessHours = r.business_hours

    const out: Record<string, unknown> = {
      site_name_ko: safeKo(siteName),
      tagline_ko: safeKo(tagline),
      logo_url: typeof r.moit_badge_url === 'string' ? r.moit_badge_url : '',
      contact_phone: typeof r.support_phone === 'string' ? r.support_phone : '',
      contact_email: typeof r.support_email === 'string' ? r.support_email : '',
      contact_address: typeof r.company_address === 'string' ? r.company_address : '',
      operating_hours: safeKo(businessHours),
    }
    if (typeof r.min_order_vnd === 'number') out.min_order_vnd = r.min_order_vnd
    if (typeof r.delivery_fee_vnd === 'number') out.delivery_fee_vnd = r.delivery_fee_vnd
    if (typeof r.free_delivery_threshold_vnd === 'number')
      out.free_delivery_threshold_vnd = r.free_delivery_threshold_vnd

    return NextResponse.json(out)
  } catch (err) {
    const message = err instanceof Error ? err.message : '설정 조회 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

type PatchBody = {
  site_name_ko?: string
  tagline_ko?: string
  logo_url?: string
  contact_phone?: string
  contact_email?: string
  contact_address?: string
  operating_hours?: string
  min_order_vnd?: number
  delivery_fee_vnd?: number
  free_delivery_threshold_vnd?: number
}

export async function PATCH(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(
    request.headers.get('authorization'),
    'settings.edit'
  )
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  try {
    const body = (await request.json()) as PatchBody
    const admin = getSupabaseAdminClient()

    const payload: Record<string, unknown> = {}
    if (body.site_name_ko !== undefined)
      payload.site_name = { ko: typeof body.site_name_ko === 'string' ? body.site_name_ko : '' }
    if (body.tagline_ko !== undefined)
      payload.tagline = { ko: typeof body.tagline_ko === 'string' ? body.tagline_ko : '' }
    if (body.logo_url !== undefined)
      payload.moit_badge_url = typeof body.logo_url === 'string' ? body.logo_url : null
    if (body.contact_phone !== undefined)
      payload.support_phone = typeof body.contact_phone === 'string' ? body.contact_phone : null
    if (body.contact_email !== undefined)
      payload.support_email = typeof body.contact_email === 'string' ? body.contact_email : null
    if (body.contact_address !== undefined)
      payload.company_address = typeof body.contact_address === 'string' ? body.contact_address : null
    if (body.operating_hours !== undefined)
      payload.business_hours = {
        ko: typeof body.operating_hours === 'string' ? body.operating_hours : '',
      }
    if (typeof body.min_order_vnd === 'number') payload.min_order_vnd = body.min_order_vnd
    if (typeof body.delivery_fee_vnd === 'number') payload.delivery_fee_vnd = body.delivery_fee_vnd
    if (typeof body.free_delivery_threshold_vnd === 'number')
      payload.free_delivery_threshold_vnd = body.free_delivery_threshold_vnd

    if (Object.keys(payload).length === 0)
      return NextResponse.json({ error: '수정할 필드가 없습니다.' }, { status: 400 })

    const { error: updateError } = await admin
      .from('site_settings')
      .update(payload)
      .eq('id', SITE_SETTINGS_ID)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : '설정 저장 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
