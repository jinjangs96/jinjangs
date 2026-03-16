import 'server-only'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAnonServerClient } from '@/lib/supabase/admin'

type RequireUserOk = {
  ok: true
  user: {
    id: string
    email: string | null
  }
}

type RequireUserFail = {
  ok: false
  response: NextResponse
}

export type RequireUserResult = RequireUserOk | RequireUserFail

function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!value) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL')
  return value
}

function getSupabaseAnonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!value) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return value
}

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization')
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : ''

  if (accessToken) {
    const anon = getSupabaseAnonServerClient()
    const { data, error } = await anon.auth.getUser(accessToken)
    if (data.user && !error) {
      return { user: data.user, error: null }
    }
  }

  const cookieStore = await cookies()
  const serverClient = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // read-mostly route handler path
        }
      },
    },
  })

  const { data, error } = await serverClient.auth.getUser()
  return { user: data.user ?? null, error }
}

export async function requireUser(request: Request): Promise<RequireUserResult> {
  const { user, error } = await getUserFromRequest(request)
  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Unauthorized: login required' },
        { status: 401 }
      ),
    }
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email ?? null,
    },
  }
}
