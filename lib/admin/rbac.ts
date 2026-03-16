import type { StaffPermission, StaffRole } from '@/lib/types'

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: '사장',
  ops_manager: '운영 매니저',
  staff: '직원',
  finance: '재무',
  viewer: '열람자',
}

export const ROLE_PERMISSIONS: Record<StaffRole, StaffPermission[]> = {
  owner: [
    'orders.view', 'orders.edit', 'orders.create',
    'inventory.view', 'inventory.edit',
    'products.view', 'products.edit',
    'payments.view', 'payments.confirm',
    'reports.view', 'reports.export',
    'users.view', 'users.edit',
    'settings.view', 'settings.edit',
  ],
  ops_manager: [
    'orders.view', 'orders.edit', 'orders.create',
    'inventory.view', 'inventory.edit',
    'products.view', 'products.edit',
    'payments.view', 'payments.confirm',
    'reports.view',
    'settings.view',
  ],
  staff: [
    'orders.view', 'orders.edit', 'orders.create',
    'inventory.view',
    'products.view',
  ],
  finance: [
    'orders.view',
    'payments.view', 'payments.confirm',
    'reports.view', 'reports.export',
  ],
  viewer: [
    'orders.view',
    'inventory.view',
    'products.view',
    'reports.view',
  ],
}

export const ROUTE_PERMISSIONS: Record<string, StaffPermission[]> = {
  '/admin/dashboard': [],
  '/admin/orders': ['orders.view'],
  '/admin/manual-orders/new': ['orders.create'],
  '/admin/inventory': ['inventory.view'],
  '/admin/inventory/movements': ['inventory.view'],
  '/admin/products': ['products.view'],
  '/admin/payment-reconciliation': ['payments.view'],
  '/admin/delivery-zones': ['settings.view'],
  '/admin/bank-accounts': ['settings.view'],
  '/admin/reports': ['reports.view'],
  '/admin/reports/monthly': ['reports.view'],
  '/admin/reports/products': ['reports.view'],
  '/admin/users': ['users.view'],
  '/admin/users/[id]': ['users.view'],
  '/admin/reviews': ['orders.view'],
  '/admin/members': ['orders.view'],
  '/admin/points': ['settings.view'],
  '/admin/hero-banners': ['settings.edit'],
  '/admin/floating-icons': ['settings.edit'],
  '/admin/footer': ['settings.edit'],
  '/admin/site-settings': ['settings.edit'],
  '/admin/policies': ['settings.edit'],
  '/admin/notifications': ['settings.view'],
}

export function getDefaultPermissions(role: StaffRole): StaffPermission[] {
  return ROLE_PERMISSIONS[role] || []
}

export function hasPermission(role: StaffRole, permission: StaffPermission) {
  if (role === 'owner') return true
  return getDefaultPermissions(role).includes(permission)
}

export function hasAnyPermission(role: StaffRole, permissions: StaffPermission[]) {
  return permissions.some((permission) => hasPermission(role, permission))
}

export function canAccessRoute(role: StaffRole, route: string) {
  const match = Object.keys(ROUTE_PERMISSIONS)
    .filter((path) => route.startsWith(path))
    .sort((a, b) => b.length - a.length)[0]

  if (!match) return true
  const required = ROUTE_PERMISSIONS[match]
  if (required.length === 0) return true
  return hasAnyPermission(role, required)
}
