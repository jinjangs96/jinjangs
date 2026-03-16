import { getSupabaseAdminClient, getSupabaseAnonServerClient } from '@/lib/supabase/admin'
import type { StaffPermission, StaffRole } from '@/lib/types'
import { hasPermission as roleHasPermission } from '@/lib/admin/rbac'

export async function assertAdminPermissionByAccessToken(
  authorizationHeader: string | null,
  requiredPermission: StaffPermission
) {
  const accessToken = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length).trim()
    : ''

  if (!accessToken) {
    return { ok: false as const, error: '인증 토큰이 필요합니다.' }
  }

  const anonClient = getSupabaseAnonServerClient()
  const { data: userData, error: userError } = await anonClient.auth.getUser(accessToken)
  if (userError || !userData.user) {
    return { ok: false as const, error: '로그인 정보가 유효하지 않습니다.' }
  }

  const adminClient = getSupabaseAdminClient()
  const { data: roleData, error: roleError } = await adminClient
    .from('app_user_roles')
    .select('role,is_active')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (roleError) {
    return { ok: false as const, error: '권한 확인에 실패했습니다. app_user_roles 테이블을 확인해주세요.' }
  }

  if (!roleData || roleData.is_active === false) {
    return { ok: false as const, error: '활성화된 어드민 계정이 아닙니다.' }
  }

  const role = roleData.role as StaffRole
  if (!roleHasPermission(role, requiredPermission)) {
    return { ok: false as const, error: '요청한 작업 권한이 없습니다.' }
  }

  return { ok: true as const, userId: userData.user.id, role }
}
