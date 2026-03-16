import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export async function canWriteReview(userId: string, productId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('order_items')
    .select('id, order_id, orders!inner(user_id, order_status)')
    .eq('product_id', productId)
    .eq('orders.user_id', userId)
    .in('orders.order_status', ['completed', 'delivered'])
    .limit(1)

  if (error) {
    return {
      canWrite: false,
      reason: error.message,
    }
  }

  return {
    canWrite: (data ?? []).length > 0,
    reason: (data ?? []).length > 0 ? null : '구매 완료 이력이 필요합니다.',
  }
}
