import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

type ProfileBody = {
  full_name?: string
  phone?: string
}

export async function GET(request: Request) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('id,email,full_name,phone')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (error) {
    console.error('[account/profile] GET error', error)
    return NextResponse.json(
      { ok: false, error: '프로필을 불러오지 못했습니다.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    profile: {
      id: auth.user.id,
      email: data?.email ?? auth.user.email ?? '',
      full_name: data?.full_name ?? '',
      phone: data?.phone ?? '',
    },
  })
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response

  let body: ProfileBody
  try {
    body = (await request.json()) as ProfileBody
  } catch {
    return NextResponse.json({ ok: false, error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const fullName = String(body.full_name ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  if (!fullName) {
    return NextResponse.json({ ok: false, error: '이름을 입력해주세요.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from('profiles')
    .upsert(
      {
        id: auth.user.id,
        email: auth.user.email,
        full_name: fullName,
        phone: phone || null,
      },
      { onConflict: 'id' }
    )

  if (error) {
    console.error('[account/profile] PATCH error', error)
    return NextResponse.json(
      { ok: false, error: '프로필 저장에 실패했습니다.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    profile: {
      id: auth.user.id,
      email: auth.user.email ?? '',
      full_name: fullName,
      phone,
    },
  })
}
