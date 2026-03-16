import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireAppRole } from '@/lib/auth/require-app-role'

export async function GET(request: Request) {
  const auth = await requireAppRole(request, [
    'owner',
    'ops_manager',
    'finance',
  ])
  if (!auth.ok) return auth.response

  const errors: string[] = []

  const safeSelect = async (source: string, limit: number) => {
    try {
      const admin = getSupabaseAdminClient()
      const { data, error } = await admin.from(source).select('*').limit(limit)
      if (error) {
        console.error(`[reports/monthly] select failed: ${source}`, error)
        errors.push(`select:${source}:${error.message}`)
        return []
      }
      return (data ?? []) as Record<string, unknown>[]
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[reports/monthly] select exception: ${source}`, error)
      errors.push(`select:${source}:${message}`)
      return []
    }
  }

  const [monthly, products, channels] = await Promise.all([
    safeSelect('v_monthly_sales_summary', 60),
    safeSelect('v_product_sales_summary', 200),
    safeSelect('v_channel_sales_summary', 100),
  ])

  return NextResponse.json(
    {
      ok: true,
      monthly,
      products,
      channels,
      errors,
    },
    { status: 200 }
  )
}
