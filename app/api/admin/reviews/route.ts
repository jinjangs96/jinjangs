import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

export async function GET(request: Request) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'orders.view')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })

  try {
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin.from('reviews').select('*').order('created_at', { ascending: false }).limit(500)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, reviews: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : '리뷰 목록 조회 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
