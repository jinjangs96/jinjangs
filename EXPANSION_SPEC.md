# Jin Jang's Kitchen - Expansion Specification (7 Features)

This document provides Cursor/Codex-ready specifications for expanding Jin Jang's Kitchen with 7 core features while maintaining the existing storefront + admin structure.

## Updated Route Tree

### Public Routes (Maintained + Expanded)
```
/                              Home (hero + featured products)
/shop                          Product listing (with filters)
/shop/[slug]                   Product detail (ENHANCED: gallery + options + food info)
/cart                          Shopping cart
/checkout                      Checkout (ENHANCED: delivery zones + payment methods)
/order-complete/[id]           Order confirmation (NEW)
/track-order                   Order tracking for guests (NEW)
/login                         Login (ENHANCED: real Supabase auth)
/register                      Register (ENHANCED: real Supabase auth)
/account                       Member dashboard
/account/addresses             Saved addresses (NEW)
/account/orders                Order history
/account/orders/[id]           Order detail with timeline (NEW)
/account/points                Points dashboard
```

### Admin Routes (Maintained + Expanded)
```
/admin/login                   Admin login
/admin/dashboard               Dashboard
/admin/orders                  Order management
/admin/products                Product management (ENHANCED: multi-image + options)
/admin/bank-accounts           Bank account / QR management
/admin/notifications           Notification settings
/admin/footer                  Footer management
/admin/floating-icons          Floating icons management
/admin/site-settings           Site settings
/admin/policies                Policy pages
/admin/members                 Member management
/admin/points                  Points policy
/admin/delivery-zones          Delivery zones management (NEW)
/admin/payment-reconciliation  Payment confirmation (NEW)
/admin/hero-banners            Hero banner management
```

## 1. Multi-Image Product Gallery

### Data Model Extensions

```typescript
// New Types in lib/types.ts

interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string
  is_primary: boolean
  display_order: number
  uploaded_at: string
}

// Existing Product type extends to include:
interface Product {
  // ... existing fields ...
  image_url: string                    // Keep for backward compat
  images: ProductImage[]               // NEW: Full gallery
}
```

### Admin Page: /admin/products (Enhanced)

**Component: ProductImageUploadSection**
- Props: `productId: string, onImagesChange: (images: ProductImage[]) => void`
- Features:
  - Drag & drop multi-file upload
  - Multiple file selection input
  - Progress bar for batch uploads
  - Thumbnail strip showing all images
  - Reorder via drag handles
  - Mark as primary (badge display)
  - Delete with confirmation
  - Alt text editor inline
  - Image preview on hover

**Local State:**
```typescript
const [images, setImages] = useState<ProductImage[]>([])
const [uploading, setUploading] = useState(false)
const [uploadProgress, setUploadProgress] = useState(0)
const [previewUrl, setPreviewUrl] = useState<string | null>(null)
```

### Storefront Page: /shop/[slug] (Enhanced)

**Component: ProductImageGallery**
- Props: `images: ProductImage[], productName: string`
- Features:
  - Main image display (large, centered)
  - Thumbnail strip below (scrollable on mobile)
  - Left/right arrows (desktop) or swipe (mobile)
  - Mobile: Swipe left/right to change main image
  - Desktop: Click thumbnail to change main image
  - Keyboard navigation (arrow keys)
  - Accessibility: alt text per image
  - Zoom icon button (for future modal zoom feature)
  - Touch-friendly on mobile (larger tap targets)

**Local State:**
```typescript
const [activeImageIndex, setActiveImageIndex] = useState(0)
const [isSwiping, setIsSwiping] = useState(false)
```

---

## 2. Product Options Structure + Price Deltas

### Data Model Extensions

```typescript
// Updated Option Types in lib/types.ts

interface ProductOptionValue {
  id: string
  group_id: string
  label_ko: string
  display_order: number
  is_available: boolean
  price_rule: {
    apply_price_delta: boolean
    price_delta_vnd: number
  }
  image_url?: string
}

interface ProductOptionGroup {
  id: string
  product_id: string
  name_ko: string
  required: boolean
  selection_type: 'single' | 'multiple'
  min_select: number
  max_select: number
  display_order: number
  option_values: ProductOptionValue[]
}

// Update Product to use new structure:
// option_groups: ProductOptionGroup[]
```

### Admin Page: /admin/products (Enhanced)

**Component: ProductOptionsEditor**
- Props: `productId: string, optionGroups: ProductOptionGroup[], onUpdate: (groups) => void`
- Features:
  - List of option groups with drag handles
  - Add new option group button
  - For each group:
    - Name input
    - Selection type (single/multiple) radio
    - Required toggle
    - Min/max select inputs
    - Delete button
  - For each option value within group:
    - Label input
    - Price delta toggle + input (conditional)
    - Available toggle
    - Delete button
    - Drag handle for reordering
  - Add new option value button within each group
  - Validation: max >= min, selections match constraints

**Local State:**
```typescript
const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>([])
```

### Storefront Page: /shop/[slug] (Enhanced)

**Component: ProductOptionSelector**
- Props: `optionGroups: ProductOptionGroup[], onSelectionChange: (selected) => void, currentPrice: number`
- Features:
  - Display options below product title
  - For single-select groups: Button group / Radio card / Dropdown (by constraint)
  - For multi-select groups: Checkbox cards / Toggles
  - Each option shows label + price delta (if any)
  - Real-time price calculation shown below
  - Validation feedback:
    - Red border if required group not selected
    - "Select up to X" message if max exceeded
    - "Select at least Y" message if min not met
  - Unavailable options shown as disabled (grayed out)
  - Mobile: Full-width card buttons
  - Desktop: Inline layout with clear labels

**Local State:**
```typescript
const [selectedOptions, setSelectedOptions] = useState<Map<string, string[]>>(new Map())
const [priceDeltas, setPriceDeltas] = useState(0)
const [validationErrors, setValidationErrors] = useState<string[]>([])
```

---

## 3. Delivery Zones Management

### Data Model

```typescript
// New Types in lib/types.ts

interface DeliveryZone {
  id: string
  zone_name: string
  district: string
  ward?: string
  is_active: boolean
  supports_jarred_dishes: boolean          // 장요리 (냉장배송)
  supports_poke: boolean                    // 포케 (근거리만)
  delivery_fee_vnd: number
  eta_min_minutes: number
  eta_max_minutes: number
  free_shipping_threshold_vnd: number
  sort_order: number
}
```

### Admin Page: /admin/delivery-zones (New)

**Features:**
- List table with columns:
  - Zone name
  - District / Ward
  - Status (Active/Inactive toggle)
  - Jarred Dishes? / Poke? (checkmarks)
  - Delivery Fee
  - ETA (min-max)
  - Free Ship Threshold
  - Edit / Delete buttons
- Add new zone button (modal form)
- Edit zone (modal form with same fields)
- Delete with confirmation
- Drag to reorder (sort_order)
- Search/filter by district

**Components:**
- DeliveryZoneTable
  - Props: `zones: DeliveryZone[], onEdit, onDelete, onReorder`
  - Local state: `selectedZone`

- DeliveryZoneModal
  - Props: `zone: DeliveryZone | null, onSave, onClose`
  - Form fields with validation
  - Local state: `formData`

### Storefront Checkout (Enhanced)

**Component: DeliveryZoneSelector**
- Props: `zones: DeliveryZone[], cartItems: CartItem[], onZoneSelect: (zone) => void`
- Features:
  - Auto-match zone based on customer's district input
  - Show available zones
  - Display delivery fee + ETA for each zone
  - Warn if cart contains poke but zone doesn't support it
  - Show free shipping threshold
  - Pre-select based on previous orders if logged in

**Local State:**
```typescript
const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null)
const [matchedZones, setMatchedZones] = useState<DeliveryZone[]>([])
const [warnings, setWarnings] = useState<string[]>([])
```

---

## 4. Payment Reconciliation Admin

### Data Model

```typescript
// Update in lib/types.ts

// Split payment_status from order_status
type OrderStatus = 'new' | 'accepted' | 'preparing' | 'out_for_delivery' | 'completed' | 'canceled'
type PaymentStatus = 'pending_transfer' | 'payment_review' | 'paid' | 'failed' | 'refunded'

// Update Order interface
interface Order {
  // ... existing fields ...
  order_status: OrderStatus        // Renamed from 'status'
  payment_status: PaymentStatus    // NEW: Split from order_status
}

// New type
interface Payment {
  id: string
  order_id: string
  amount_vnd: number
  method: 'bank_transfer' | 'qr_code'
  payer_name: string
  reference_code: string
  expected_transfer_at?: string
  confirmed_at?: string
  confirmed_by?: string
  admin_note?: string
  created_at: string
}
```

### Admin Page: /admin/payment-reconciliation (New)

**Features:**
- Tab navigation:
  - "입금 대기" (Pending Transfer) - payment_status='pending_transfer'
  - "확인 필요" (Review Needed) - payment_status='payment_review'
  - "결제 완료" (Paid) - payment_status='paid'
  - "문제" (Failed) - payment_status='failed'

- Table columns:
  - Order ID
  - Customer Name / Phone
  - Amount (VND)
  - Payment Method
  - Payer Name
  - Reference Code
  - Expected Time
  - Confirmed Time
  - Confirmed By
  - Action buttons

- Action buttons:
  - Confirm Payment (mark as 'paid', set confirmed_at)
  - Review Later (mark as 'payment_review')
  - Mark Failed (mark as 'failed', optional refund note)
  - Edit Note (inline or modal)

- Search/filter by:
  - Order ID
  - Customer Phone
  - Date range
  - Payment method

**Components:**
- PaymentReconciliationTabs
  - Props: `payments: Payment[], onConfirm, onReview, onFail`
  - Local state: `activeTab, filteredPayments`

- PaymentTable
  - Props: `payments: Payment[], onAction`
  - Features: Sortable columns, pagination (20 per page)

- PaymentActionModal
  - Props: `payment: Payment, action: 'confirm' | 'review' | 'fail', onSubmit, onClose`
  - Form fields: admin_note textarea
  - Local state: `note, submitting`

---

## 5. Order Tracking

### Data Model (Update Order)

```typescript
// Add to Order interface
interface Order {
  // ... existing fields ...
  tracking_code: string                    // Guest tracking identifier
  order_status: OrderStatus               // Timeline display
  payment_status: PaymentStatus          // Timeline display
}

// New types
interface OrderStatusTimeline {
  status: OrderStatus
  timestamp: string
  label_ko: string
}

interface PaymentStatusTimeline {
  status: PaymentStatus
  timestamp: string
  label_ko: string
}
```

### Public Page: /order-complete/[id] (New)

After checkout/payment, customer is redirected here.

**Components:**
- OrderConfirmationHeader
  - Order number (large, copyable)
  - Order date/time
  - Total amount
  
- OrderSummary
  - Product items summary
  - Subtotal / Delivery fee / Total
  - Delivery address (abbreviated)
  
- PaymentStatus
  - Current payment status (Pending/Confirmed/etc.)
  - For pending: "입금 안내" section with:
    - Bank accounts + QR codes
    - Reference code (copyable)
    - Payer name field (for verification)
  - For paid: "입금 완료" confirmation

- OrderTracking
  - Current status badge
  - Timeline (Preparing → Out for Delivery → Completed)
  - Estimated time if applicable

- ActionButtons
  - "주문 추적" → /track-order?order=xxx
  - "계속 쇼핑하기" → /shop

**Local State:**
```typescript
const [order, setOrder] = useState<Order | null>(null)
const [referenceCode, setReferenceCode] = useState<string>('')
```

### Public Page: /track-order (New)

Non-member order tracking.

**Features:**
- Search form:
  - Order ID input
  - Phone number OR Reference Code input
  - Submit button
  
- Validation:
  - Order ID + Phone number must match
  - OR Order ID + Reference Code must match

- Results display (same structure as /order-complete):
  - Order number
  - Items summary
  - Payment status + details (if pending)
  - Order status timeline
  - Delivery address (hidden except last 4 chars)
  - "문의" button if issues

**Local State:**
```typescript
const [searchParams, setSearchParams] = useState({ orderId: '', phone: '', refCode: '' })
const [orderData, setOrderData] = useState<Order | null>(null)
const [searching, setSearching] = useState(false)
const [error, setError] = useState<string | null>(null)
```

### Member Page: /account/orders/[id] (Enhanced)

Detailed order view for logged-in members.

**Features (over guest view):**
- Full address (not hidden)
- Reorder button (add items + quantities to cart)
- Request return/refund (if within 7 days)
- Points earned display (if applicable)
- Order status + payment status history (full timeline with timestamps)
- Edit delivery note option (if not yet out for delivery)

---

## 6. Member Address Management

### Data Model

```typescript
// New in lib/types.ts

interface Address {
  id: string
  user_id: string                         // Supabase auth user ID
  label: 'home' | 'office' | 'other'
  recipient_name: string
  recipient_phone: string
  district: string
  ward?: string
  address_line1: string                   // Full address or street
  address_line2?: string                  // Apartment, suite, etc.
  delivery_note?: string
  is_default: boolean
  created_at: string
}

// Update Profile type to include
interface Profile {
  id: string                              // auth.users.id
  full_name: string
  email: string
  phone?: string
  preferred_language: 'ko' | 'vi' | 'en' | 'ja' | 'zh'
  marketing_opt_in: boolean
  created_at: string
  updated_at: string
}
```

### Member Page: /account/addresses (New)

**Features:**
- Address list with cards:
  - Label badge (집 / 회사 / 기타)
  - Recipient name + phone
  - Address preview
  - Default badge (if is_default)
  - Edit / Delete buttons

- Add address button (modal form)
- Edit address button (pre-fill modal)
- Delete with confirmation
- Set as default (radio select)

- Form validation:
  - Recipient name required
  - Phone format validation
  - Address required
  - District required

**Components:**
- AddressCard
  - Props: `address: Address, onEdit, onDelete, onSetDefault, isDefault`
  - Local state: None

- AddressModal
  - Props: `address: Address | null, onSave, onClose`
  - Form fields with validation
  - Local state: `formData, saving`

- AddressList
  - Props: `addresses: Address[], onEdit, onDelete, onSetDefault`
  - Sort: default first, then by created_at desc

**Local State (Page):**
```typescript
const [addresses, setAddresses] = useState<Address[]>([])
const [isModalOpen, setIsModalOpen] = useState(false)
const [editingAddress, setEditingAddress] = useState<Address | null>(null)
```

### Checkout Integration

**Component Update: CheckoutAddressSection**
- If logged in: Show saved addresses dropdown
- Option to use new address (same modal as /account/addresses)
- Pre-fill from default address if available
- Show "Same as billing" toggle (for future orders)

---

## 7. Real Login / Register with Supabase Auth

### Data Model

```typescript
// In lib/types.ts

interface AuthUser {
  id: string                              // Supabase auth user ID
  email: string
  created_at: string
}

// Profile same as above (stores extra user data)
```

### Supabase Setup Notes

Tables needed:
- `auth.users` (built-in, managed by Supabase)
- `profiles` (custom, mirrors auth.users + extra fields)
- `addresses` (custom)
- `orders` (extends existing, add user_id FK)
- `payments` (custom)
- `delivery_zones` (custom)

Auth strategies:
- Email/password (built-in)
- Google OAuth (Supabase built-in, optional)
- Facebook OAuth (Supabase built-in, optional)

### Public Page: /login (Enhanced)

**Features:**
- Email input
- Password input with show/hide toggle
- "비밀번호 찾기" link (future: password reset flow)
- "계정이 없으신가요?" link → /register
- Sign in button (loading state)
- Error display (invalid credentials, network error)
- Social login buttons (Google, Facebook - UI only, implementation note for later)

**Validation:**
- Email: valid format
- Password: not empty
- Required both

**Error handling:**
- "이메일 또는 비밀번호가 잘못되었습니다."
- "네트워크 오류. 다시 시도해주세요."

**Flow:**
1. Form submit → Supabase.auth.signInWithPassword()
2. Success → Set auth context → Redirect to /account or previous route
3. Failure → Display error, clear form
4. Loading state: Button disabled, spinner

**Local State:**
```typescript
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [showPassword, setShowPassword] = useState(false)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

### Public Page: /register (Enhanced)

**Features:**
- Full name input
- Email input
- Password input with show/hide
- Password confirm input
- Phone number input (optional)
- Preferred language dropdown (한국어 / 베트남어 / English / 日本語 / 中文)
- Terms of service checkbox (required)
- Marketing emails checkbox (optional)
- Sign up button (loading state)
- Error display
- "이미 계정이 있으신가요?" link → /login

**Validation:**
- Full name: not empty, min 2 chars
- Email: valid format, not already registered
- Password: min 8 chars, includes uppercase + number (or similar rules)
- Password confirm: must match
- Phone: valid format (if provided)
- Terms: must be checked
- Debounce email check (400ms)

**Error handling:**
- "이미 가입된 이메일입니다."
- "비밀번호가 일치하지 않습니다."
- "비밀번호는 최소 8자 이상이어야 합니다."
- Network error

**Flow:**
1. Form submit → Validate all fields
2. If valid → Supabase.auth.signUp()
3. Success → Create profile record → Show confirmation message → Redirect to /login or auto-login
4. Failure → Display error

**Local State:**
```typescript
const [formData, setFormData] = useState({
  fullName: '',
  email: '',
  password: '',
  passwordConfirm: '',
  phone: '',
  preferredLanguage: 'ko',
  termsAccepted: false,
  marketingOptIn: false,
})
const [errors, setErrors] = useState<{ [key: string]: string }>({})
const [emailChecking, setEmailChecking] = useState(false)
const [loading, setLoading] = useState(false)
```

### Auth Context (New)

**Location:** `lib/auth-context.tsx`

```typescript
interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  signUp: (email, password, fullName, phone, language) => Promise<void>
  signIn: (email, password) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuth = () => useContext(AuthContext)
```

**Provider:**
- Wraps entire app in layout
- Listens to Supabase auth changes
- Loads user profile on mount
- Handles auth state persistence

### Protected Routes

**Middleware / Route Protection:**
- /account/* → Redirect to /login if not authenticated
- /checkout → Allow guest, but show "Sign in for saved addresses" prompt
- /admin/* → Redirect to /admin/login if not authenticated

### Header Update

When authenticated:
- Show user name
- Dropdown menu:
  - My Account
  - Addresses
  - Points
  - Orders
  - Sign out
  
When not authenticated:
- Show Login / Sign Up buttons

---

## Design/UX Rules

### Colors (Existing)
- Background: #FFFBF5
- Surface: #FFFFFF
- Primary Wood: #8B5E34
- Soft Wood: #E8D9C5
- Text: #111827
- Muted: #6B7280
- Border: #E5E7EB
- Success: #2E7D32
- Danger: #B42318

### Spacing
- Mobile: 16px base unit (4, 8, 12, 16, 20, 24px)
- Desktop: 24px base unit (8, 16, 24, 32, 40px)
- Cards: 16px padding on mobile, 24px on desktop
- Section gaps: 24px on mobile, 32px on desktop

### Typography
- Heading: Noto Sans KR 700
- Body: Noto Sans KR 400
- Small: Noto Sans KR 400, 12-14px
- Line height: 1.5 for body, 1.3 for headings

### Mobile Rules
- Buttons: Full width unless in a group
- Forms: Stack vertically, 100% width inputs
- Gallery: Swipe-enabled, thumb strip below
- Options: Card buttons, full width in single-select mode
- Address fields: Full width, clear labels
- Tables: Collapse to cards on mobile

---

## Component List (New + Enhanced)

### Storefront Components
1. ProductImageGallery (NEW)
2. ProductOptionSelector (NEW)
3. DeliveryZoneSelector (NEW)
4. OrderConfirmationHeader (NEW)
5. OrderSummary (NEW)
6. PaymentStatusDisplay (NEW)
7. OrderTrackingTimeline (NEW)
8. OrderTrackingSearch (NEW)
9. AddressCard (NEW)
10. AddressModal (NEW)
11. AuthForm (ENHANCED - split from existing)

### Admin Components
1. ProductImageUploadSection (NEW)
2. ProductOptionsEditor (NEW)
3. DeliveryZoneTable (NEW)
4. DeliveryZoneModal (NEW)
5. PaymentReconciliationTabs (NEW)
6. PaymentTable (NEW)
7. PaymentActionModal (NEW)

---

## Props & State Summary (All Components)

[See detailed specs in sections above for each component]

---

## Notes for Cursor/Codex Implementation

1. **Maintain existing routes**: Don't delete or rename current pages. Extend only.

2. **Data model priorities**:
   - Start with types.ts extensions
   - Update mock-data.ts with new data structures
   - Supabase migration prep (document table schemas, no actual DB required for MVP)

3. **Implementation order**:
   - Phase 1: Multi-image (add ProductImage type, update Product, admin upload UI, storefront gallery)
   - Phase 2: Options (add ProductOptionValue/Group types, update admin editor, add option selector to checkout)
   - Phase 3: Delivery zones (add table, admin page, integrate into checkout)
   - Phase 4: Payment reconciliation (split order_status/payment_status, new admin page)
   - Phase 5: Order tracking (/order-complete, /track-order, timelines)
   - Phase 6: Addresses (new page, checkout integration, auth context setup)
   - Phase 7: Auth (login/register, context provider, protected routes)

4. **No breaking changes**:
   - Keep existing Product.image_url for backward compat
   - Keep old ProductOption interface during transition
   - Existing orders still work with current data model

5. **Future considerations**:
   - MegaPay PG integration (show as "MVP 2단계 예정" disabled button)
   - Password reset flow (/forgot-password)
   - Social login (UI ready, implementation deferred)
   - Address geocoding for better zone matching
   - Email notifications for order status changes

---

**Created**: March 2026
**Version**: 1.0
**Target Stack**: Next.js 16 + React + Tailwind + shadcn/ui + Supabase (Auth + PostgreSQL)
**Status**: Ready for Cursor/Codex Implementation
