import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseAnonServerClient } from '@/lib/supabase/admin'

type RegisterBody = {
  name?: string
  email?: string
  password?: string
  phone?: string
  agreeMarketing?: boolean
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password?.trim()
    const phone = body.phone?.trim() || null
    const agreeMarketing = Boolean(body.agreeMarketing)

    if (!name || !email || !password) {
      return NextResponse.json({ error: '필수 정보를 모두 입력해주세요.' }, { status: 400 })
    }

    const supabaseAnon = getSupabaseAnonServerClient()
    const { data, error } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          agree_marketing: agreeMarketing,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const user = data.user
    if (!user) {
      return NextResponse.json({ error: '회원가입 처리에 실패했습니다.' }, { status: 500 })
    }

    const supabaseAdmin = getSupabaseAdminClient()
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: user.id,
        email,
        full_name: name,
        phone,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      return NextResponse.json(
        {
          error:
            '회원은 생성되었지만 profiles 저장에 실패했습니다. profiles 테이블과 RLS/정책을 확인해주세요.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      needsEmailConfirm: !data.session,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '회원가입 처리 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
