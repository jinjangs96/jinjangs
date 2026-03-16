# Phase 3: Enhanced Features Implementation Spec

## 1. Updated Problems to Fix

### Current Issues:
1. **Account dashboard spacing**: Cards too cramped (insufficient gap, minimal padding)
2. **No review system**: Missing user-generated content & social proof
3. **Limited SNS integration**: Social links scattered, not centrally managed
4. **Weak footer compliance**: Missing legal info required for VN e-commerce
5. **Single product image**: No gallery support for multi-angle views
6. **Opaque points system**: Admin multipliers exposed to customers
7. **Missing public pages**: FAQ, delivery, contact, policies not implemented
8. **No order tracking**: Customers can't track status after purchase
9. **Weak design hierarchy**: Wood texture over-applied in some areas
10. **Guest checkout gaps**: No buyer/recipient separation, no saved addresses

---

## 2. Updated Route Tree

### Storefront Public Routes (21 total)
```
/ ........................ Home (hero + featured products + SNS CTA)
/shop ..................... Product listing with filters
/shop/[slug] .............. Product detail (with reviews, multi-image gallery)
/cart ..................... Cart management
/checkout ................. Checkout flow (payment_status separate)
/order-complete ........... Confirmation + payment instructions + follow CTA
/track-order .............. Order tracking by order ID + phone
/account .................. Account dashboard (redesigned spacing)
/account/orders ........... Order history + reorder button
/account/points ........... Points ledger (no admin multipliers shown)
/account/settings ......... Profile + saved addresses + preferences
/login .................... Member login
/register ................. New member registration
/faq ....................... FAQ (content from /admin/faq)
/delivery ................. Delivery zones, fees, ETA info
/contact .................. Contact form + support options
/terms .................... Terms of service
/privacy .................. Privacy policy
/refund ................... Refund & cancellation policy
/(policy-slug) ............ Dynamic policy pages
/search ................... Product search
```

### Admin Routes (18 total - existing + new)
```
/admin/dashboard .......... Dashboard (unchanged)
/admin/orders ............. Orders (with payment_status column)
/admin/payments ........... Payment settlement (new)
/admin/products ........... Products (multi-image gallery added)
/admin/hero-banners ....... Banners (unchanged)
/admin/members ............ Members (unchanged)
/admin/points ............. Points policy (admin multipliers hidden from storefront)
/admin/reviews ............ Reviews moderation (new)
/admin/bank-accounts ...... Bank accounts (unchanged)
/admin/notifications ...... Notifications (unchanged)
/admin/floating-icons ..... Floating icons + SNS links (extended)
/admin/footer ............. Footer links + SNS (extended)
/admin/site-settings ...... Site settings (extended with legal fields)
/admin/policies ........... Policy pages editor
/admin/faq ................ FAQ management (new)
/admin/delivery-zones ..... Delivery zone & fee management (new)
/admin/payment-methods .... Payment method status (new)
/admin/legal-pages ........ Vietnam compliance info (new)
```

---

## 3. New/Updated Public Pages

### Page: / (Home - Enhanced)
**Changes:**
- Add delivery info banner (region + fee + ETA snippet) below hero
- Add "Follow on SNS" CTA section before footer
- Keep existing hero + featured products

**Data needed:**
- Hero banners
- Featured products
- Delivery summary (default/primary region)
- SNS links (Facebook, TikTok, Instagram, Threads)

### Page: /shop/[slug] (Product Detail - Enhanced)
**Changes:**
- Multi-image gallery (main + thumbnails)
- Add review section below product info
- Review summary (rating avg, count)
- Add share/follow micro-actions
- Keep existing options & checkout flow

**New sections:**
- ProductImageGallery component
- ReviewSummary component
- ReviewList component
- Share/Follow buttons

### Page: /account (Account Dashboard - Redesigned)
**Changes:**
- **Increase vertical spacing**: gap-6 (24px mobile, 28px desktop)
- **Increase card padding**: p-6 mobile, p-8 desktop
- **Stack sections vertically** with clear visual separation
- **Hide admin fields**: No multipliers (1.5x, 2.0x, etc.)
- **Show only**: Available points, pending points, next tier distance, recent ledger

**Structure:**
```
Profile Section
  ├─ Avatar + Name + Phone
  ├─ Member Tier (Bronze/Silver/Gold/VIP)
  ├─ Edit Settings Button
  └─ [gap: 24px mobile / 28px desktop]

Points Section
  ├─ Available Points Card
  ├─ Pending Points Card (from recent orders)
  ├─ Next Tier Progress
  └─ [gap: 24px / 28px]

Saved Addresses Section
  ├─ List of saved addresses
  ├─ Add Address button
  └─ [gap: 24px / 28px]

Recent Orders Section
  ├─ Last 3 orders
  ├─ View All Orders button
  └─ [gap: 24px / 28px]

Points Ledger Preview
  ├─ Recent 5 transactions
  └─ View Full Ledger button
```

### New Page: /account/settings
**Content:**
- Edit profile (name, phone, email)
- Saved addresses (add, edit, delete, set default)
- Account preferences (newsletter opt-in, etc.)
- Logout button

### New Page: /track-order
**Content:**
- Order ID + Phone number input
- Shows: Order status, payment status, current location, ETA
- Timeline view of order progression
- Download invoice option

### New Pages: /faq, /delivery, /contact, /terms, /privacy, /refund
**Content source:** Admin CMS
- /faq → content from /admin/faq
- /delivery → hardcoded delivery zones + fees (from admin)
- /contact → contact form (email integration in Phase 4)
- /terms, /privacy, /refund → from /admin/policies

### New Page: /order-complete (Enhanced)
**Changes:**
- Show payment method + instructions (account transfer or QR code)
- Add "Follow us on SNS" CTA
- Add "Rate this order" button (link to review page)
- Add "Download invoice" option
- Keep existing order summary

---

## 4. New/Updated Admin Pages

### Page: /admin/reviews (New)
**Features:**
- Review list with filters (product, rating, status)
- Moderation: approve/hide/delete
- Bulk actions
- Review details modal (text, images, metadata)
- Column: Product | Rating | Text preview | Images | Status | Points awarded | Actions

**State management:**
```typescript
interface ReviewFilters {
  productId?: string
  ratingFilter?: 'all' | 1 | 2 | 3 | 4 | 5
  statusFilter?: 'pending' | 'approved' | 'hidden'
  dateRange?: { from: Date; to: Date }
}
```

### Page: /admin/faq (New)
**Features:**
- FAQ list
- Add/edit/delete FAQ
- Reorder via drag-drop
- Preview on storefront

### Page: /admin/delivery-zones (New)
**Features:**
- List of delivery zones (district level)
- Add zone with name, bounds, delivery_fee_vnd
- Delivery time (in hours)
- Active/inactive toggle

### Page: /admin/payment-methods (New)
**Features:**
- Bank account status (active/inactive)
- QR code management
- MegaPay status (disabled until Phase 2)
- Instructions text for each method

### Page: /admin/products (Enhanced)
**New features:**
- Multi-image upload (drag-drop)
- Set featured image
- Image reorder
- Food info fields (storage, allergens, weight)
- Option group editor (UI improvements)

### Page: /admin/points (Enhanced)
**New features:**
- Hide "tier multipliers" from admin view (show only in configs)
- Manual adjustment UI (member select, points, reason)
- Review reward settings (text_review_points, photo_reward_points)
- First purchase bonus settings

### Page: /admin/floating-icons (Enhanced)
**New features:**
- Add SNS link management
- Icon type selector (zalo, phone, kakao, facebook, instagram, tiktok, threads)
- URL input
- On/off toggle
- Sort order

### Page: /admin/footer (Enhanced)
**New features:**
- SNS section (links + icons)
- Legal compliance section
  - Business name
  - Tax ID (MST)
  - Address
  - Phone
  - Email
  - Operating hours
- Bộ Công Thương badge URL input
- Footer sections management (links)

### Page: /admin/legal-pages (New)
**Features:**
- Store Vietnam compliance info
- Logo URL
- Company name (VN + EN)
- Business registration info
- Tax registration info
- Bộ Công Thương badge info

---

## 5. Data Model Additions

### New Types

```typescript
// Review System
interface Review {
  id: string
  product_id: string
  member_phone: string
  member_name: string
  verified_purchase: boolean
  order_id: string
  rating: 1 | 2 | 3 | 4 | 5
  title: string
  text: string
  images: ReviewImage[]
  moderation_status: 'pending' | 'approved' | 'hidden' | 'reported'
  points_awarded: number
  created_at: string
  updated_at: string
  helpful_count: number
  unhelpful_count: number
}

interface ReviewImage {
  id: string
  review_id: string
  url: string
  display_order: number
  created_at: string
}

// Product Images
interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string
  is_featured: boolean
  display_order: number
  uploaded_at: string
}

// Product Option Value
interface ProductOptionValue {
  id: string
  option_group_id: string
  product_id: string
  name_ko: string
  name_vi?: string
  name_en?: string
  display_order: number
  is_available: boolean
  price_delta_vnd: number
  image_url?: string
}

// Updated Product structure
interface Product {
  // ... existing fields ...
  images: ProductImage[]  // NEW: multi-image support
  
  // NEW: Food information
  storage_instructions?: string
  allergens?: string[]
  ingredients?: string
  weight_g?: number
  shelf_life_days?: number
  origin_country?: string
  
  // NEW: Review summary
  review_count: number
  rating_average: number
}

// Updated ProductOptionGroup
interface ProductOptionGroup {
  id: string
  product_id: string
  name_ko: string
  name_vi?: string
  name_en?: string
  required: boolean
  single_select: boolean
  min_select: number
  max_select: number
  display_order: number
  option_values: ProductOptionValue[]
}

// Points System
interface PointsPolicy {
  earn_rate_percent: number
  min_order_to_earn_vnd: number
  min_points_to_redeem: number
  max_redeem_percent: number
  expiry_months: number
  
  // Review rewards (NOT multipliers - just flat points)
  review_text_points: number
  review_with_photo_bonus_points: number
  
  // First purchase (NEW)
  first_purchase_bonus_points: number
  
  // Tier multipliers (ADMIN ONLY - not shown to customers)
  tier_multipliers: {
    bronze: number
    silver: number
    gold: number
    vip: number
  }
  tier_thresholds: {
    silver: number
    gold: number
    vip: number
  }
}

interface PointsLedgerEntry {
  id: string
  member_phone: string
  type: 'earn' | 'redeem' | 'expire' | 'admin_adjust' | 'review_bonus'
  points_amount: number
  balance_after: number
  description: string
  order_id?: string
  review_id?: string
  created_at: string
  admin_note?: string
  created_by: string  // 'system' or admin email
}

// Social Links
interface SocialLink {
  id: string
  platform: 'facebook' | 'instagram' | 'tiktok' | 'threads'
  url: string
  is_active: boolean
  display_order: number
  icon_type: string
}

// Footer
interface FooterSection {
  id: string
  title_ko: string
  title_vi?: string
  title_en?: string
  links: FooterLink[]
  display_order: number
}

interface FooterLink {
  id: string
  section_id: string
  label_ko: string
  label_vi?: string
  label_en?: string
  url: string
  open_in_new_tab: boolean
  display_order: number
}

// Legal/Compliance
interface LegalInfo {
  company_name_ko: string
  company_name_en: string
  company_name_vi: string
  tax_id: string  // MST
  address_vi: string
  phone: string
  email: string
  operating_hours: string
  bco_thong_bao_url?: string  // Bộ Công Thương badge
  logo_url: string
}

// FAQ
interface FAQ {
  id: string
  question_ko: string
  question_vi?: string
  question_en?: string
  answer_ko: string
  answer_vi?: string
  answer_en?: string
  category: string
  display_order: number
  is_active: boolean
}

// Delivery Zones
interface DeliveryZone {
  id: string
  district_name: string
  delivery_fee_vnd: number
  delivery_time_hours: number
  is_active: boolean
  coverage_bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
}

// Order (Payment Status Separation)
interface Order {
  // ... existing fields ...
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'verified' | 'failed' | 'refunded'
  payment_method: 'bank_transfer' | 'qr_code' | 'megapay'
  payment_verified_at?: string
  payment_verified_by?: string  // admin email
}
```

---

## 6. Component Additions

### ProductImageGallery
**Path:** `/components/storefront/product-image-gallery.tsx`
**Props:**
```typescript
interface ProductImageGalleryProps {
  images: ProductImage[]
  productName: string
  selectedOptionImage?: string  // fallback if option has specific image
}
```
**Features:**
- Main image display (fill container)
- Thumbnail carousel (horizontal)
- Mobile: swipe to next
- Desktop: click thumbnail
- Responsive breakpoints

### ReviewSummary
**Path:** `/components/storefront/review-summary.tsx`
**Props:**
```typescript
interface ReviewSummaryProps {
  reviewCount: number
  averageRating: number
  showWriteReview: boolean
  onWriteReview?: () => void
}
```
**Display:**
- Star rating (filled/empty)
- Average rating (e.g., "4.5/5")
- Review count ("87 reviews")
- CTA: "Write a review" (if showWriteReview)

### ReviewList
**Path:** `/components/storefront/review-list.tsx`
**Props:**
```typescript
interface ReviewListProps {
  productId: string
  initialReviews: Review[]
  sortBy?: 'newest' | 'highest_rating'
}
```
**Features:**
- List of approved reviews only
- Verified Purchase badge
- Star rating
- Author name (first name only)
- Review date (relative: "2 days ago")
- Review text
- Review images (grid)
- Helpful/Unhelpful buttons
- Empty state message

### ReviewWriteModal
**Path:** `/components/storefront/review-write-modal.tsx`
**Props:**
```typescript
interface ReviewWriteModalProps {
  productId: string
  productName: string
  orderId: string
  onSuccess: () => void
}
```
**Features:**
- Star rating picker (1-5)
- Text input (title + description)
- Image upload (max 3 images)
- Submit button
- Points reward display (informational)

### PointsCard
**Path:** `/components/storefront/points-card.tsx`
**Props:**
```typescript
interface PointsCardProps {
  availablePoints: number
  pendingPoints: number
  tierName: string
  nextTierDistance: number
  onViewLedger: () => void
}
```
**Display:**
- Available points (large number)
- Pending points (smaller, next orders)
- Next tier progress bar
- "View full ledger" link

**IMPORTANT:** Do NOT show multipliers (1.5x, 2.0x)

### ProductImageUploadManager
**Path:** `/components/admin/product-image-upload-manager.tsx`
**Props:**
```typescript
interface ProductImageUploadManagerProps {
  productId: string
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
  onFeaturedChange: (imageId: string) => void
}
```
**Features:**
- Drag-drop upload zone
- Preview grid
- Reorder via drag-drop
- Set as featured button
- Delete button per image

### ReviewModerationTable
**Path:** `/components/admin/review-moderation-table.tsx`
**Props:**
```typescript
interface ReviewModerationTableProps {
  reviews: Review[]
  onApprove: (reviewId: string) => void
  onHide: (reviewId: string) => void
  onDelete: (reviewId: string) => void
  onViewDetails: (reviewId: string) => void
}
```

### FooterEnhanced
**Path:** `/components/storefront/footer-enhanced.tsx`
**Props:**
```typescript
interface FooterEnhancedProps {
  sections: FooterSection[]
  socialLinks: SocialLink[]
  legalInfo: LegalInfo
}
```
**New sections:**
- Legal info (company name, tax ID, address, phone, email)
- SNS links
- Bộ Công Thương badge (clickable)
- Operating hours
- Customer support message

---

## 7. Props Proposal

### Updated Order Checkout Form
```typescript
interface CheckoutFormData {
  // Buyer info
  buyer_name: string
  buyer_phone: string
  buyer_email?: string
  
  // Recipient info (can differ from buyer)
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  recipient_district: string
  
  // Delivery
  delivery_zone_id: string
  delivery_time_window?: string
  
  // Payment
  payment_method: 'bank_transfer' | 'qr_code'
  special_requests?: string
  
  // Points (optional)
  use_points?: number
  
  // Save address
  save_address?: boolean
}
```

### Admin Review Filters
```typescript
interface ReviewFilterState {
  productFilter: string  // product ID or 'all'
  ratingFilter: 'all' | 1 | 2 | 3 | 4 | 5
  statusFilter: 'pending' | 'approved' | 'hidden' | 'all'
  dateRange: {
    startDate?: Date
    endDate?: Date
  }
  sortBy: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating'
}
```

---

## 8. Local State Proposal

### Product Detail Page
```typescript
const [selectedOptions, setSelectedOptions] = useState<{
  [optionGroupId: string]: string | string[]
}>({})
const [selectedImageIndex, setSelectedImageIndex] = useState(0)
const [reviewSortBy, setReviewSortBy] = useState<'newest' | 'highest_rating'>('newest')
const [showReviewModal, setShowReviewModal] = useState(false)
const [quantity, setQuantity] = useState(1)
```

### Account Dashboard
```typescript
const [activeSection, setActiveSection] = useState<'profile' | 'addresses' | 'settings'>('profile')
const [editingAddress, setEditingAddress] = useState<string | null>(null)
const [showAddAddressForm, setShowAddAddressForm] = useState(false)
```

### Admin Review Moderation
```typescript
const [filters, setFilters] = useState<ReviewFilterState>({
  productFilter: 'all',
  ratingFilter: 'all',
  statusFilter: 'all',
  dateRange: {},
  sortBy: 'newest'
})
const [selectedReview, setSelectedReview] = useState<Review | null>(null)
const [showDetailsModal, setShowDetailsModal] = useState(false)
```

---

## 9. Admin Fields

### /admin/products
**New fields to add:**
- Product images (multi-upload with reorder)
- Storage instructions (text)
- Allergens (multi-select dropdown)
- Ingredients (text area)
- Weight (number in grams)
- Shelf life (number in days)
- Origin country (select)

**Updated fields:**
- Option groups → Option values (new structure with price_delta_vnd)

### /admin/points
**New fields:**
- Review text reward points (integer)
- Review photo bonus (integer)
- First purchase bonus (integer)
- Tier multipliers (admin-only inputs, don't show to storefront)

### /admin/floating-icons (Extended)
**New fields:**
- Platform select (zalo, phone, kakao, facebook, instagram, tiktok, threads)
- SNS link URL
- Icon type selector
- Active/inactive
- Sort order
- Mobile show/desktop show (toggles)

### /admin/footer (Extended)
**New sections:**
- Company legal info (name, tax ID, address, phone, email)
- Operating hours (text)
- Bộ Công Thương URL
- SNS links management
- Footer link sections (existing)

---

## 10. Storefront Fields

### Customer Account (/account)
**Remove from view:**
- Points multiplier (1.5x, 2.0x, etc.)
- Tier thresholds exact numbers

**Show:**
- Available points (large, prominent)
- Pending points (from recent orders)
- Next tier: "X points until Gold"
- Recent points ledger (last 5 transactions, text only, no multipliers)

### Product Detail Page (/shop/[slug])
**Add:**
- Multiple images (gallery + thumbnails)
- Storage instructions
- Allergens list
- Ingredients
- Weight
- Shelf life notice
- Origin country

### Checkout Form
**Add:**
- Recipient name (separate from buyer)
- Recipient phone (separate from buyer)
- Saved address selection
- Delivery zone selector
- Delivery fee display
- Payment method instructions (detailed for bank transfer + QR)

---

## 11. Interaction Rules

### Product Image Gallery
1. Desktop: Click thumbnail → update main image
2. Mobile: Swipe left/right → next/prev image, or tap thumbnail
3. Fallback: If option has specific image, preview it while option selected
4. Maintain aspect ratio (4:3 or 16:9)

### Review Submission
1. Must be verified purchase (order_id matched)
2. One review per order
3. Rating (1-5 stars) is required
4. Text is optional
5. Images are optional (up to 3)
6. Submission grants points immediately (pending confirmation)
7. Admin can hide/approve review without affecting points (already awarded)

### Points Display
1. Never show multiplier numbers to customer (hide "1.5x", "2.0x")
2. Show only: Available, Pending, Next tier distance
3. Ledger: Show reason but not "tier_multiplier=1.5"
4. Admin can see multipliers in /admin/points

### Checkout - Payment Method
1. Bank transfer: Show account details + ETA note ("we verify within X hours")
2. QR code: Show QR image + amount + ETA note
3. MegaPay: Disable button with "Coming soon" badge (Phase 2)
4. After payment: Show instructions on order-complete page

### Account Dashboard Spacing
- Mobile: All gaps = 24px (gap-6)
- Desktop: All gaps = 28-32px (gap-7 or gap-8)
- Card padding mobile: p-6 (24px)
- Card padding desktop: p-8 (32px)
- Sections visually distinct, breathing room

### Footer Compliance
1. All required legal info present in footer
2. Footer links match actual routes (/terms, /privacy, etc.)
3. Bộ Công Thương badge clickable (opens external URL)
4. Company info (name, tax ID, address) always visible
5. SNS links grouped separately

---

## 12. Mobile Rules

### Product Detail & Review
- Images: Swipe or tap thumbnail (no hover states)
- Review form: Full-width inputs, stacked layout
- Review images: Stack vertically if multiple
- Options: Prefer button/chip over dropdown
- Multi-select options: Checkbox cards (not native checkbox)

### Account Dashboard
- Stack all sections vertically
- Buttons: Full width or 2-column grid
- No sidebar, no left nav
- Saved addresses: Expandable cards or list
- Points card: Single column, large text

### Checkout
- Buyer/recipient: Stacked form
- Address: Dropdown to saved addresses
- Delivery zone: Radios or buttons (not dropdown)
- Payment method: Large buttons, clear instructions
- Order summary: Sticky top or after form

### Footer
- Accordion or stacked: sections expand on tap
- Links: Full width, minimum 44px touch target
- SNS icons: 40-44px size, good spacing
- Legal info: Readable size (16px+)

### Admin Pages
- Table: Horizontal scroll if needed
- Images: Preview in modal on tap
- Upload: Tap to trigger file picker
- Modals: Full screen on mobile

---

## 13. Footer Compliance Notes

### Required Elements (Vietnam E-commerce):
- [ ] Business/company name (Vietnamese + English)
- [ ] Tax ID (MST)
- [ ] Full address (Vietnamese)
- [ ] Phone number
- [ ] Email address
- [ ] Operating hours
- [ ] Links to legal pages (Terms, Privacy, Refund)
- [ ] FAQ link
- [ ] Contact/support link
- [ ] Delivery info
- [ ] Bộ Công Thương notification badge (with external link)
- [ ] Customer complaint handling notice
- [ ] SNS links (if present, include)

### Structure (3-column desktop, stacked mobile):
1. **Company Info Column**
   - Logo
   - Company name (VN)
   - Tax ID
   - Address
   - Phone
   - Email

2. **Customer Service Column**
   - FAQ
   - Delivery
   - Contact
   - Complaint handling info

3. **Legal & SNS Column**
   - Terms
   - Privacy
   - Refund Policy
   - SNS links
   - Bộ Công Thương badge

### Implementation Notes:
- Background: Subtle wood texture (opacity 0.02-0.03) on top thin stripe
- Link color: Primary wood color
- Font size: 14px body, 16px headings
- Link target: _blank for external links (Bộ Công Thương, SNS)
- Mobile: Accordion for sections, or simple stacking

---

## 14. Review System Notes

### Key Principles:
1. **Honest feedback, not biased**: Hide review vote counts to avoid "popularity bias"
2. **Verified purchase badge**: Always show, builds trust
3. **Balanced display**: Show mix of ratings (not just 5-star)
4. **Recent first**: Sort by newest by default
5. **Images matter**: Distinguish product images from review images

### Point Rewards:
- Text review: +5 points (flat, not multiplied)
- Photo included: +2 bonus (flat, not multiplied)
- Total: Up to 7 points per review
- **Awarded immediately**, no moderation delay
- Admin can hide review without reclaiming points (already given)

### Admin Moderation:
- Pending → Approved/Hidden workflow
- Bulk actions available
- Reason for hiding (optional admin note)
- Delete is soft-delete (flag as deleted, don't erase)

### Storefront Display:
- Approved reviews only
- Show rating, text, images
- Author: First name + last initial (privacy)
- Date: Relative ("3 days ago")
- No review voting (no like/dislike to avoid manipulation)

---

## 15. Points System Notes

### Customer Visibility (What NOT to show):
- DO NOT show: Multiplier numbers (1.5x, 2.0x, etc.)
- DO NOT show: Tier thresholds (500k, 1M, etc. exact numbers)
- DO NOT show: Internal policy calculations

### Customer Visibility (What TO show):
- Available points: "사용 가능한 포인트: 2,450"
- Pending points: "다음 주문에서 적립 예정: 850"
- Next tier: "Gold까지 1,500 포인트"
- Ledger: "주문 #1234 적립 (+850p)" without multiplier mention

### Admin Visibility:
- All policy fields (multipliers, thresholds)
- Manual adjustment UI
- Points ledger with admin notes
- Review reward settings

### Implementation:
- Points never negative
- Expiry handled automatically (cleanup job)
- Review bonus: Text (+5) + Photo (+2), not multiplied
- First purchase bonus: One-time, triggered on first order

---

## 16. Notes for Cursor/Codex

### Structure & Maintainability:
1. **Keep existing routes**: Don't delete `/admin/dashboard`, `/admin/orders`, etc.
2. **Add new routes incrementally**: New files don't break old ones
3. **Types backward compatible**: Add fields, don't remove
4. **Existing mock data**: Extend MOCK_PRODUCTS with new fields, don't rewrite

### Implementation Priority:
1. **Phase 3A** (Week 1): Types + new routes scaffolding
   - Add new types to lib/types.ts
   - Create new page files (route structure)
   - Extend existing types (Product, Order, etc.)

2. **Phase 3B** (Week 2): Components + admin pages
   - ProductImageGallery, ReviewList, ReviewSummary
   - Admin review/faq/delivery pages
   - Enhanced product admin (multi-image upload)

3. **Phase 3C** (Week 3): Storefront pages + design
   - Account dashboard (spacing fixes)
   - Product detail (gallery + reviews)
   - Public pages (faq, contact, terms, etc.)
   - Footer redesign

4. **Phase 3D** (Week 4): Polish + QA
   - Mobile responsiveness
   - Design tokens (wood texture application)
   - Integration testing

### Cursor/Codex Integration:
- Use this document as context ("@PHASE_3_IMPLEMENTATION.md")
- Reference specific section numbers: "Implement per section 7, ProductImageGallery"
- Ask for clarification on interaction rules (section 11)
- Use mock data structure as template for real data

### Database Schema (When Ready):
These types map to Supabase tables:
```sql
-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  product_id UUID,
  member_phone VARCHAR,
  verified_purchase BOOLEAN,
  order_id UUID,
  rating INT,
  title VARCHAR,
  text TEXT,
  moderation_status VARCHAR,
  points_awarded INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Review Images
CREATE TABLE review_images (
  id UUID PRIMARY KEY,
  review_id UUID,
  url VARCHAR,
  display_order INT,
  created_at TIMESTAMP
)

-- Product Images
CREATE TABLE product_images (
  id UUID PRIMARY KEY,
  product_id UUID,
  url VARCHAR,
  alt_text VARCHAR,
  is_featured BOOLEAN,
  display_order INT,
  uploaded_at TIMESTAMP
)

-- Delivery Zones
CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY,
  district_name VARCHAR,
  delivery_fee_vnd INT,
  delivery_time_hours INT,
  is_active BOOLEAN
)

-- Extend existing tables:
-- products: ADD images JSON[], storage_instructions, allergens, ingredients, weight_g, shelf_life_days
-- orders: ADD payment_status VARCHAR SEPARATE FROM order_status
-- points_ledger: ADD review_id UUID, ADD points_awarded INT
```

### No External Dependencies:
- All features use existing tech stack (React, Tailwind, Zod, SWR)
- No new npm packages required
- Image upload: Use existing blob upload pattern
- Drag-drop: Use native HTML5 or existing library

### Testing Checklist:
- [ ] Account spacing: 24px mobile, 28px desktop
- [ ] Points: No multipliers shown to customer
- [ ] Reviews: Only approved shown, verified purchase badge present
- [ ] Product images: Gallery works on mobile (swipe/tap)
- [ ] Footer: All legal required fields present
- [ ] Routes: All 21 storefront + 18 admin routes accessible
- [ ] Mobile: Touch targets ≥44px, no hover states
- [ ] Design: Wood texture subtle (opacity <0.05) except as noted

### Common Pitfalls:
1. **Don't hide reviews completely**: Show honest mix, not just 5-star
2. **Don't multiply review points**: Flat +5 for text, +2 for photo
3. **Don't expose multipliers in storefront**: Hide 1.5x, 2.0x, thresholds
4. **Don't overuse wood texture**: Subtle only, never on forms/tables
5. **Don't forget payment_status**: Separate from order_status, required in checkout
6. **Don't skip mobile spacing**: Specific px values matter (24px, 28px, 32px)

---

## Next Steps:
1. Cursor reads this document
2. Extend lib/types.ts with new types
3. Create new route files (stubs)
4. Implement components (sections 6-8)
5. Update admin pages (section 4)
6. Enhance storefront pages (section 3)
7. Apply design tokens (section 8, 12, 13)
8. Test checklist (above)
