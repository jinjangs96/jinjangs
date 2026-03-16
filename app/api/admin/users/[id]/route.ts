import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

type Body = {
  role?: 'owner' | 'ops_manager' | 'staff' | 'finance' | 'viewer'
  is_active?: boolean
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'users.view')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })
  const { id } = await context.params
  const admin = getSupabaseAdminClient()
  const [{ data: role, error: roleError }, { data: profile, error: profileError }] = await Promise.all([
    admin.from('app_user_roles').select('*').eq('user_id', id).maybeSingle(),
    admin.from('profiles').select('*').eq('id', id).maybeSingle(),
  ])
  if (roleError) return NextResponse.json({ error: roleError.message }, { status: 400 })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })
  return NextResponse.json({ success: true, user: { role, profile } })
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await assertAdminPermissionByAccessToken(request.headers.get('authorization'), 'users.edit')
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 })
  const { id } = await context.params
  const body = (await request.json()) as Body
  const admin = getSupabaseAdminClient()
  const { error } = await admin.from('app_user_roles').upsert({
    user_id: id,
    role: body.role ?? 'viewer',
    is_active: body.is_active ?? true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
