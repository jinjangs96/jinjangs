export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'out_for_delivery'
  | 'completed'
  | 'canceled'

export type PaymentMethod = 'bank' | 'cod' | 'megapay'

export type PaymentStatus = 'pending' | 'confirmed' | 'failed'

// ============ AUTH TYPES ============

export interface AuthUser {
  id: string
  email: string
  name: string
  phone?: string
  created_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  name: string
  phone?: string
  language: 'ko' | 'vi' | 'en'
  marketing_consent: boolean
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  user_id: string
  label: 'home' | 'office' | 'other'
  recipient_name: string
  phone: string
  address: string
  detailed_address: string
  postal_code?: string
  delivery_note?: string
  is_default: boolean
  created_at: string
}

export interface OrderTrackingToken {
  order_id: string
  token: string
  customer_phone: string
  created_at: string
}

// Staff/Admin Role System (ERP)
export type StaffRole = 'owner' | 'ops_manager' | 'staff' | 'finance' | 'viewer'

export interface StaffUser {
  id: string
  email: string
  name: string
  role: StaffRole
  is_active: boolean
  pin_code?: string // 4-digit for quick actions
  permissions: StaffPermission[]
  created_at: string
  last_login_at?: string
}

export type StaffPermission = 
  | 'orders.view' | 'orders.edit' | 'orders.create'
  | 'inventory.view' | 'inventory.edit'
  | 'products.view' | 'products.edit'
  | 'payments.view' | 'payments.confirm'
  | 'reports.view' | 'reports.export'
  | 'users.view' | 'users.edit'
  | 'settings.view' | 'settings.edit'

// Legacy role (deprecated, kept for backward compat)
export type UserRole = 'owner' | 'admin' | 'ops' | 'viewer'

export interface OrderItem {
  id: string
  name: string
  qty: number
  price_vnd: number
  options?: string
}

export interface StatusHistory {
  status: OrderStatus
  changed_at: string
  changed_by: string
  note?: string
}

export type OrderSourceChannel = 'web' | 'zalo' | 'phone' | 'walk_in' | 'kakao'

export interface Order {
  id: string
  short_id: string
  created_at: string
  customer_name: string
  customer_phone: string
  address: string
  district: string
  delivery_slot: string
  slot_text: string
  special_requests?: string
  payment_method: PaymentMethod
  total_vnd: number
  status: OrderStatus
  items: OrderItem[]
  status_history: StatusHistory[]
  version: number
  cancel_reason?: string
  // ERP Extensions
  source_channel: OrderSourceChannel
  payment_status: PaymentStatus
  internal_note?: string
  inventory_applied: boolean
  assigned_staff_id?: string
}

export interface BankAccount {
  id: string
  bank_name: string
  account_name: string
  account_number: string
  qr_image_url?: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface NotificationRecipient {
  email: string
  id: string
}

export interface NotificationLog {
  id: string
  type: string
  status: 'sent' | 'failed'
  created_at: string
  error?: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: UserRole
}

// ============ STOREFRONT TYPES ============

export type ProductCategory = 'jarred' | 'poke' | 'sets' | 'sides' | 'beverages'

// ============ PRODUCT OPTION TYPES ============

export type ProductBadge = 'popular' | 'beginner_friendly' | 'gift_recommended' 
  | 'local_delivery' | 'cold_shipping' | 'nationwide_coming'

export interface ProductOptionValue {
  id: string
  option_group_id: string
  name_ko: string
  description_ko?: string
  display_order: number
  is_available: boolean
  is_sold_out?: boolean
  price_rule: {
    apply_price_delta: boolean
    price_delta_vnd: number
  }
  image_url?: string
}

export interface ProductOptionGroup {
  id: string
  product_id: string
  name_ko: string
  required: boolean
  single_select: boolean
  min_select: number
  max_select: number
  display_order: number
  option_values: ProductOptionValue[]
}

// ============ PRODUCT IMAGE TYPES ============

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string
  is_featured: boolean
  display_order: number
  uploaded_at: string
}

export interface Product {
  id: string
  slug: string
  name_ko: string
  desc_ko: string
  category: ProductCategory
  base_price_vnd: number
  image_url: string              // Featured image (backward compat)
  images?: ProductImage[]        // Multi-image support
  option_groups: ProductOptionGroup[]
  
  // Food information
  storage_instructions?: string
  allergens?: string[]
  ingredients?: string
  weight_g?: number
  shelf_life_days?: number
  food_warnings?: string
  delivery_scope?: 'local' | 'nationwide'
  
  // Badges & status
  badges?: ProductBadge[]
  is_available: boolean
  is_popular: boolean
  sort_order: number
  created_at: string
}

// ============ POINTS TYPES (UPDATED) ============

export interface PointsConfig {
  points_per_vnd: number
  min_order_to_earn_vnd: number
  min_points_to_redeem: number
  max_redeem_percent: number
  expiry_months: number
  first_purchase_bonus_points: number
}

export interface PointsTransaction {
  id: string
  member_phone: string
  type: 'earn' | 'redeem' | 'expire' | 'admin_adjust'
  points_amount: number
  balance_after: number
  description: string
  order_id?: string
  created_at: string
  admin_note?: string
}

export interface HeroBanner {
  id: string
  image_url: string
  link_url?: string
  alt_text: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface FloatingIcon {
  id: string
  type: 'zalo' | 'phone' | 'kakao' | 'custom'
  label_ko: string
  url: string
  icon_url?: string
  is_active: boolean
  sort_order: number
}

export interface FooterLink {
  id: string
  label_ko: string
  url: string
  open_in_new_tab: boolean
}

export interface FooterSection {
  id: string
  title_ko: string
  links: FooterLink[]
}

export interface SiteSettings {
  logo_url: string
  site_name_ko: string
  tagline_ko: string
  contact_phone: string
  contact_email: string
  contact_address: string
  min_order_vnd: number
  delivery_fee_vnd: number
  free_delivery_threshold_vnd: number
  operating_hours: string
  social_links: {
    facebook?: string
    instagram?: string
    zalo?: string
  }
  footer_sections: FooterSection[]
}

export interface PolicyPage {
  id: string
  slug: string
  title_ko: string
  content_html: string
  updated_at: string
}

// ============ MEMBER & POINTS TYPES ============

export type MemberTier = 'bronze' | 'silver' | 'gold' | 'vip'

export interface Member {
  id: string
  phone: string
  name: string
  email?: string
  tier: MemberTier
  points_balance: number
  total_orders: number
  total_spent_vnd: number
  joined_at: string
  last_order_at?: string
}

export type PointsTransactionType = 'earn' | 'redeem' | 'expire' | 'adjust'

export interface PointsLedger {
  id: string
  member_id: string
  type: PointsTransactionType
  amount: number
  balance_after: number
  description: string
  order_id?: string
  created_at: string
  created_by: string
}

export interface PointsPolicy {
  earn_rate_percent: number // e.g., 1 = 1% of order total
  min_order_to_earn_vnd: number
  points_per_vnd: number // e.g., 1 point = 1000 VND
  min_points_to_redeem: number
  max_redeem_percent: number // max % of order that can be paid with points
  expiry_months: number
  tier_thresholds: {
    silver: number
    gold: number
    vip: number
  }
  tier_multipliers: {
    bronze: number
    silver: number
    gold: number
    vip: number
  }
}

// ============ CART TYPES ============

export interface CartItemOption {
  group_id: string
  group_name: string
  option_id: string
  option_name: string
  price_delta_vnd: number
}

export interface CartItem {
  id: string
  product_id: string
  product_name: string
  product_image: string
  base_price_vnd: number
  quantity: number
  selected_options: CartItemOption[]
  special_request?: string
}

export interface Cart {
  items: CartItem[]
  subtotal_vnd: number
  delivery_fee_vnd: number
  points_discount_vnd: number
  total_vnd: number
}

// ============ CHECKOUT TYPES ============

export interface DeliverySlot {
  id: string
  date: string
  time_start: string
  time_end: string
  label_ko: string
  is_available: boolean
}

export interface CheckoutForm {
  customer_name: string
  customer_phone: string
  address: string
  district: string
  delivery_slot_id: string
  payment_method: PaymentMethod
  special_requests?: string
  use_points: number
}

// ============ INVENTORY TYPES (ERP) ============

export type InventoryMovementType = 'in' | 'out' | 'adjust' | 'waste' | 'order_deduct'

export interface InventoryItem {
  id: string
  product_id: string
  product_name: string
  sku?: string
  current_qty: number
  unit: string // 'ea' | 'g' | 'kg' | 'ml' | 'L'
  low_stock_threshold: number
  last_updated: string
}

export interface InventoryMovement {
  id: string
  inventory_item_id: string
  product_id: string
  type: InventoryMovementType
  qty_change: number // positive for in, negative for out
  qty_before: number
  qty_after: number
  reason: string
  order_id?: string
  created_by: string
  created_at: string
}

// ============ DELIVERY ZONE TYPES (ERP) ============

export interface DeliveryZone {
  id: string
  name_ko: string
  districts: string[]
  delivery_fee_vnd: number
  free_delivery_threshold_vnd?: number
  min_order_vnd: number
  estimated_minutes: number
  is_active: boolean
  sort_order: number
}

// ============ PAYMENT RECONCILIATION TYPES (ERP) ============

export interface PaymentRecord {
  id: string
  order_id: string
  order_short_id: string
  amount_vnd: number
  payment_method: PaymentMethod
  status: PaymentStatus
  bank_account_id?: string
  confirmed_by?: string
  confirmed_at?: string
  transfer_reference?: string
  screenshot_url?: string
  notes?: string
  created_at: string
}

// ============ REPORT TYPES (ERP) ============

export interface DailySalesSummary {
  date: string
  total_orders: number
  completed_orders: number
  canceled_orders: number
  total_revenue_vnd: number
  avg_order_value_vnd: number
  top_products: { product_id: string; product_name: string; qty: number }[]
}

export interface MonthlySalesSummary {
  year: number
  month: number
  total_orders: number
  total_revenue_vnd: number
  by_channel: Record<OrderSourceChannel, { orders: number; revenue: number }>
  by_payment_method: Record<PaymentMethod, { orders: number; revenue: number }>
  by_district: { district: string; orders: number; revenue: number }[]
}
