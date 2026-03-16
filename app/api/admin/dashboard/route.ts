import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireAppRole } from '@/lib/auth/require-app-role'

type DashboardResponse = {
  ok: true
  counts: {
    orders: number
    members: number
    inventoryItems: number
    payments: number
  }
  monthly: Record<string, unknown>[]
  channels: Record<string, unknown>[]
  products: Record<string, unknown>[]
  errors: string[]
}

async function safeCount(
  table: string,
  errors: string[]
): Promise<number> {
  try {
    const admin = getSupabaseAdminClient()
    const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      console.error(`[dashboard] count failed: ${table}`, error)
      errors.push(`count:${table}:${error.message}`)
      return 0
    }
    return count ?? 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[dashboard] count exception: ${table}`, error)
    errors.push(`count:${table}:${message}`)
    return 0
  }
}

async function safeSelect(
  source: string,
  limit: number,
  errors: string[]
): Promise<Record<string, unknown>[]> {
  try {
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin.from(source).select('*').limit(limit)
    if (error) {
      console.error(`[dashboard] select failed: ${source}`, error)
      errors.push(`select:${source}:${error.message}`)
      return []
    }
    return (data ?? []) as Record<string, unknown>[]
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[dashboard] select exception: ${source}`, error)
    errors.push(`select:${source}:${message}`)
    return []
  }
}

export async function GET(request: Request) {
  const auth = await requireAppRole(request, [
    'owner',
    'ops_manager',
    'finance',
    'staff',
  ])
  if (!auth.ok) return auth.response

  const errors: string[] = []

  const [orders, members, inventoryItems, payments, monthly, channels, products] = await Promise.all([
    safeCount('orders', errors),
    safeCount('profiles', errors),
    safeCount('inventory_items', errors),
    safeCount('payments', errors),
    safeSelect('v_monthly_sales_summary', 24, errors),
    safeSelect('v_channel_sales_summary', 50, errors),
    safeSelect('v_product_sales_summary', 100, errors),
  ])

  const response: DashboardResponse = {
    ok: true,
    counts: {
      orders,
      members,
      inventoryItems,
      payments,
    },
    monthly,
    channels,
    products,
    errors,
  }

  return NextResponse.json(response, { status: 200 })
}
