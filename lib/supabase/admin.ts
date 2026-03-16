import 'server-only'

import { createClient } from '@supabase/supabase-js'

function getCommonSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!url) {
    throw new Error(
      'Missing env: NEXT_PUBLIC_SUPABASE_URL (.env.local 확인 필요)'
    )
  }

  return url
}

function getSupabaseAnonKey() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) {
    throw new Error(
      'Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local 확인 필요)'
    )
  }
  return anonKey
}

function getSupabaseServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error(
      'Missing env: SUPABASE_SERVICE_ROLE_KEY (.env.local 확인 필요, 서버 전용)'
    )
  }
  return serviceRoleKey
}

export function getSupabaseAnonServerClient() {
  const url = getCommonSupabaseUrl()
  const anonKey = getSupabaseAnonKey()
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function getSupabaseAdminClient() {
  const url = getCommonSupabaseUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
