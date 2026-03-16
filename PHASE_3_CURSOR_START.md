# Phase 3: Quick Start for Cursor/Codex

## 100-Line Action Plan

### Step 1: Extend Types (30 min)
**File:** `lib/types.ts`

Add these types after existing Order interface:

```typescript
// Review System
export interface Review {
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
  moderation_status: 'pending' | 'approved' | 'hidden'
  points_awarded: number
  created_at: string
}

export interface ReviewImage {
  id: string
  review_id: string
  url: string
  display_order: number
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string
  is_featured: boolean
  display_order: number
}

export interface ProductOptionValue {
  id: string
  option_group_id: string
  name_ko: string
  display_order: number
  is_available: boolean
  price_delta_vnd: number
}

export interface PointsPolicy {
  earn_rate_percent: number
  min_order_to_earn_vnd: number
  min_points_to_redeem: number
  max_redeem_percent: number
  expiry_months: number
  review_text_points: number
  review_with_photo_bonus_points: number
  first_purchase_bonus_points: number
  tier_multipliers: { bronze: number; silver: number; gold: number; vip: number }
  tier_thresholds: { silver: number; gold: number; vip: number }
}

export interface DeliveryZone {
  id: string
  district_name: string
  delivery_fee_vnd: number
  delivery_time_hours: number
  is_active: boolean
}

export interface SocialLink {
  id: string
  platform: 'facebook' | 'instagram' | 'tiktok' | 'threads'
  url: string
  is_active: boolean
  display_order: number
}

export interface FAQ {
  id: string
  question_ko: string
  answer_ko: string
  category: string
  display_order: number
}
```

### Step 2: Create Route Stubs (20 min)
**Files:** Create empty page.tsx in each:

- `app/(storefront)/faq/page.tsx` - FAQ list
- `app/(storefront)/delivery/page.tsx` - Delivery zones + fees
- `app/(storefront)/contact/page.tsx` - Contact form
- `app/(storefront)/track-order/page.tsx` - Order tracking
- `app/admin/reviews/page.tsx` - Review moderation
- `app/admin/faq/page.tsx` - FAQ admin
- `app/admin/delivery-zones/page.tsx` - Delivery zone admin
- `app/admin/payment-methods/page.tsx` - Payment method status

### Step 3: Build Components (1 hour)
**Priority order:**

1. `components/storefront/product-image-gallery.tsx`
   - Props: images, productName, selectedOptionImage
   - Main image + thumbnail carousel
   - Mobile swipe support

2. `components/storefront/review-summary.tsx`
   - Props: reviewCount, averageRating, showWriteReview
   - Star rating display + count badge

3. `components/storefront/review-list.tsx`
   - Props: productId, initialReviews, sortBy
   - Filter: only approved reviews
   - Show: verified badge, rating, author, date, images

4. `components/admin/review-moderation-table.tsx`
   - Props: reviews, onApprove, onHide, onDelete
   - Columns: Product | Rating | Text | Images | Status | Points | Actions

### Step 4: Update Account Page (30 min)
**File:** `app/(storefront)/account/page.tsx`

Changes:
- Add `gap-6` between all card sections (24px mobile, scale up on desktop with md:gap-7)
- Add `p-6` padding per card (md:p-8)
- Hide all multiplier/threshold mentions
- Show: availablePoints, pendingPoints, nextTierDistance
- Ledger: show reason, hide multiplier info

### Step 5: Enhance Product Detail (30 min)
**File:** `app/(storefront)/shop/[slug]/page.tsx`

Add:
- ProductImageGallery component (above options)
- Food info section (storage, allergens, weight, origin)
- ReviewSummary component
- ReviewList component
- "Write review" button → opens modal

### Step 6: Update Footer (30 min)
**File:** `components/storefront/footer-enhanced.tsx`

Add columns:
1. Company: logo, name, tax ID, address, phone, email
2. Customer: FAQ, Delivery, Contact
3. Legal: Terms, Privacy, Refund, SNS, Bộ Công Thương badge

### Step 7: Extend Mock Data (20 min)
**File:** `lib/mock-data.ts`

Add:

```typescript
export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-001',
    product_id: 'prod-001',
    member_phone: '090-1234-5678',
    member_name: '김민',
    verified_purchase: true,
    order_id: 'ord-001',
    rating: 5,
    title: '매운맛 좋아요',
    text: '맵지만 맛있어요. 추천합니다.',
    images: [],
    moderation_status: 'approved',
    points_awarded: 5,
    created_at: '2026-03-06T00:00:00Z',
  },
  // ... 2 more reviews
]

export const MOCK_POINTS_POLICY: PointsPolicy = {
  earn_rate_percent: 1,
  min_order_to_earn_vnd: 50000,
  min_points_to_redeem: 1000,
  max_redeem_percent: 30,
  expiry_months: 12,
  review_text_points: 5,
  review_with_photo_bonus_points: 2,
  first_purchase_bonus_points: 100,
  tier_multipliers: { bronze: 1, silver: 1.2, gold: 1.5, vip: 2 },
  tier_thresholds: { silver: 1000000, gold: 3000000, vip: 10000000 },
}

export const MOCK_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'dz-001',
    district_name: 'Quận 1',
    delivery_fee_vnd: 25000,
    delivery_time_hours: 1,
    is_active: true,
  },
  // ... more districts
]

export const MOCK_FAQS: FAQ[] = [
  {
    id: 'faq-001',
    question_ko: '배송은 얼마나 걸리나요?',
    answer_ko: '주문 후 1-2시간 내에 배송됩니다.',
    category: 'delivery',
    display_order: 1,
  },
  // ... more FAQs
]
```

### Step 8: Update Product Type
**File:** `lib/types.ts`

Extend Product interface:

```typescript
export interface Product {
  // ... existing fields ...
  images?: ProductImage[]  // NEW
  storage_instructions?: string  // NEW
  allergens?: string[]  // NEW
  ingredients?: string  // NEW
  weight_g?: number  // NEW
  shelf_life_days?: number  // NEW
  origin_country?: string  // NEW
  review_count?: number  // NEW
  rating_average?: number  // NEW
}
```

Update Order interface:

```typescript
export interface Order {
  // ... existing fields ...
  payment_status: 'pending' | 'verified' | 'failed' | 'refunded'  // SEPARATE from order_status
  payment_verified_at?: string  // NEW
  payment_verified_by?: string  // NEW
}
```

### Step 9: Create Public Pages
**Time:** 1 hour

Create 6 new route pages:
- `/faq` - FAQ list (read from mock)
- `/delivery` - Delivery zones + fees table
- `/contact` - Contact form placeholder
- `/track-order` - Order lookup by ID + phone
- `/terms` - Terms of service text
- `/privacy` - Privacy policy text

### Step 10: Create Admin Pages
**Time:** 1.5 hours

Create 4 new admin routes:
- `/admin/reviews` - Review moderation table
- `/admin/faq` - FAQ CRUD
- `/admin/delivery-zones` - Delivery zone CRUD
- `/admin/payment-methods` - Payment method status

### Quick Checklist
- [ ] Types extended (lib/types.ts)
- [ ] Routes created (stubs)
- [ ] ProductImageGallery component
- [ ] ReviewList + ReviewSummary components
- [ ] Admin review table component
- [ ] Account page: spacing fixed (gap-6, p-6, no multipliers)
- [ ] Product detail: gallery + reviews added
- [ ] Footer: enhanced with legal info + SNS
- [ ] Mock data: reviews, points policy, delivery zones, FAQs
- [ ] Public pages: faq, delivery, contact, terms, privacy, refund
- [ ] Admin pages: reviews, faq, delivery-zones, payment-methods

### Key Reminders
1. **Account spacing**: `gap-6` (24px), scale up with `md:gap-7` or `lg:gap-8`
2. **No multipliers in storefront**: Hide 1.5x, 2.0x, tier thresholds
3. **Reviews approval only**: Show only `moderation_status === 'approved'`
4. **Review points flat**: +5 text, +2 photo, not multiplied
5. **Payment status separate**: Different from order_status in Order type
6. **Wood texture subtle**: opacity 0.02-0.03, footer thin stripe only
7. **Mobile first**: All spacing rules start mobile, scale up

---

## Implementation Order
1. Types (Step 1) → Routes (Step 2) → Components (Step 3)
2. Then update existing pages (Step 4, 5, 6)
3. Then add mock data (Step 7, 8)
4. Then create new pages (Step 9, 10)
5. Test mobile responsiveness
6. Apply design tokens

Total time: ~5 hours for experienced dev using Cursor/Codex

Use `@PHASE_3_IMPLEMENTATION.md` for detailed specs per section.
