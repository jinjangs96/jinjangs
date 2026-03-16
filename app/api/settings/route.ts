import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const SITE_SETTINGS_ID = true

function safeKo(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return ''
  const o = obj as Record<string, unknown>
  const v = o['ko']
  return typeof v === 'string' ? v : ''
}

export async function GET() {
  try {
    const admin = getSupabaseAdminClient()
    const { data: row, error } = await admin
      .from('site_settings')
      .select('*')
      .eq('id', SITE_SETTINGS_ID)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!row) {
      return NextResponse.json(
        {
          site_name_ko: '',
          tagline_ko: '',
          support_phone: '',
          support_email: '',
          company_name: '',
          company_address: '',
          operating_hours: '',
          min_order_vnd: null,
        },
        { status: 200 }
      )
    }

    const r = row as Record<string, unknown>
    const siteName = r.site_name
    const tagline = r.tagline
    const businessHours = r.business_hours

    const supportPhone = typeof r.support_phone === 'string' ? r.support_phone : ''
    const supportEmail = typeof r.support_email === 'string' ? r.support_email : ''
    const companyName = typeof r.company_name === 'string' ? r.company_name : ''
    const companyAddress = typeof r.company_address === 'string' ? r.company_address : ''
    const minOrder =
      typeof r.min_order_vnd === 'number' && Number.isFinite(r.min_order_vnd) ? (r.min_order_vnd as number) : null

    return NextResponse.json({
      site_name_ko: safeKo(siteName),
      tagline_ko: safeKo(tagline),
      support_phone: supportPhone,
      support_email: supportEmail,
      company_name: companyName,
      company_address: companyAddress,
      operating_hours: safeKo(businessHours),
      min_order_vnd: minOrder,
      // Convenience aliases for existing frontend shape
      contact_phone: supportPhone,
      contact_email: supportEmail,
      contact_address: companyAddress,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '사이트 설정 조회 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

