# Phase 3: Visual & Architecture Reference

## Updated Route Tree (Visual)

```
진장키친 (jinjang.vn)
│
├─ Storefront (Public)
│  ├─ / (Home)
│  │  ├─ Hero banners
│  │  ├─ Delivery info summary
│  │  ├─ Featured products
│  │  └─ "Follow SNS" CTA section
│  │
│  ├─ /shop (Product list)
│  │  ├─ Category filter
│  │  ├─ Search
│  │  └─ Products grid
│  │
│  ├─ /shop/[slug] (Product detail) ← ENHANCED
│  │  ├─ ProductImageGallery (NEW)
│  │  ├─ Options
│  │  ├─ Food info (NEW)
│  │  ├─ ReviewSummary (NEW)
│  │  ├─ ReviewList (NEW)
│  │  └─ Add to cart
│  │
│  ├─ /cart (Cart)
│  ├─ /checkout (Checkout)
│  │  ├─ Buyer/Recipient form
│  │  ├─ Saved addresses
│  │  ├─ Delivery zone select
│  │  ├─ Payment method (bank/QR/MegaPay)
│  │  └─ Order review
│  │
│  ├─ /order-complete (Order confirmation)
│  │  ├─ Payment instructions
│  │  ├─ "Follow SNS" CTA
│  │  └─ "Rate order" button
│  │
│  ├─ /track-order (NEW)
│  │  └─ Order ID + phone lookup
│  │
│  ├─ /account (Account dashboard) ← REDESIGNED SPACING
│  │  ├─ Profile section (gap: 24px)
│  │  ├─ Points card (no multipliers shown)
│  │  ├─ Saved addresses (gap: 24px)
│  │  ├─ Recent orders (gap: 24px)
│  │  └─ Points ledger preview (gap: 24px)
│  │
│  ├─ /account/orders (Order history)
│  ├─ /account/points (Points ledger - no multipliers)
│  ├─ /account/settings (Profile + addresses)
│  │
│  ├─ /login (Login)
│  ├─ /register (Register)
│  │
│  ├─ /faq (NEW)
│  ├─ /delivery (NEW)
│  ├─ /contact (NEW)
│  ├─ /terms (NEW)
│  ├─ /privacy (NEW)
│  ├─ /refund (NEW)
│  ├─ /search (Advanced search)
│  │
│  └─ Footer (ENHANCED)
│     ├─ Company info
│     ├─ Customer service
│     ├─ Legal & SNS
│     └─ Bộ Công Thương badge
│
├─ Admin (Protected)
│  ├─ /admin/dashboard (Overview)
│  │
│  ├─ Orders
│  │  ├─ /admin/orders (Order list + payment_status column)
│  │  └─ /admin/payments (Payment settlement) NEW
│  │
│  ├─ Products & Content
│  │  ├─ /admin/products (Multi-image gallery NOW)
│  │  ├─ /admin/hero-banners
│  │  └─ /admin/reviews (Moderation) NEW
│  │
│  ├─ Members & Points
│  │  ├─ /admin/members
│  │  └─ /admin/points (Review rewards NOW)
│  │
│  ├─ Content Management
│  │  ├─ /admin/faq (NEW)
│  │  ├─ /admin/floating-icons (SNS NOW)
│  │  ├─ /admin/footer (SNS + Legal NOW)
│  │  ├─ /admin/site-settings
│  │  └─ /admin/policies
│  │
│  ├─ Operations
│  │  ├─ /admin/bank-accounts
│  │  ├─ /admin/delivery-zones (NEW)
│  │  ├─ /admin/payment-methods (NEW)
│  │  ├─ /admin/notifications
│  │  └─ /admin/legal-pages (NEW)
│  │
│  └─ Login
│     └─ /admin/login
```

## Component Hierarchy

### Page: /shop/[slug] (Product Detail)

```
ProductDetailPage
├─ ProductImageGallery (NEW)
│  ├─ MainImage
│  ├─ ThumbnailCarousel
│  └─ ImageCounter
│
├─ ProductInfoSection
│  ├─ Name + Price
│  └─ Description
│
├─ ProductOptionsSection
│  └─ ProductOptionSelector
│     └─ OptionCard (button/chip/radio)
│
├─ ProductFoodInfo (NEW)
│  ├─ Storage instructions
│  ├─ Allergens list
│  ├─ Ingredients
│  ├─ Weight
│  └─ Origin
│
├─ AddToCartButton
│
├─ Divider
│
├─ ReviewSummary (NEW)
│  ├─ StarRating
│  ├─ ReviewCount
│  └─ "Write review" button
│
└─ ReviewList (NEW)
   ├─ ReviewSortControl
   ├─ ReviewCard
   │  ├─ VerifiedBadge
   │  ├─ StarRating
   │  ├─ AuthorName
   │  ├─ ReviewText
   │  ├─ ReviewImages
   │  └─ Date
   └─ LoadMore
```

### Page: /account (Account Dashboard) ← REDESIGNED

```
AccountDashboard
│
├─ ProfileSection [gap-6 below]
│  ├─ Avatar
│  ├─ Name + Phone
│  ├─ TierBadge
│  └─ EditButton
│
├─ PointsCard [gap-6 below]
│  ├─ AvailablePoints (large)
│  ├─ PendingPoints
│  ├─ NextTierProgress
│  └─ ViewLedgerLink
│
├─ SavedAddressesSection [gap-6 below]
│  ├─ AddressList
│  └─ AddAddressButton
│
├─ RecentOrdersSection [gap-6 below]
│  ├─ OrderList (last 3)
│  └─ ViewAllButton
│
└─ PointsLedgerPreview [gap-6 below]
   ├─ TransactionList (last 5)
   └─ ViewFullButton

Spacing Rules:
- Mobile: gap-6 (24px), p-6 (24px per card)
- Desktop: gap-7/8 (28-32px), p-8 (32px per card)
- All sections have clear visual separation
```

### Component: ProductImageGallery

```
ProductImageGallery
│
├─ MainImageContainer
│  └─ Image (fill, 4:3 or 16:9 ratio)
│
└─ ThumbnailCarousel
   ├─ Previous button
   ├─ Thumbnails (3-5 visible)
   │  └─ Thumbnail (click updates main)
   └─ Next button

Desktop Behavior:
- Show 5 thumbnails at once
- Click thumbnail → main updates smoothly
- Swipe disabled

Mobile Behavior:
- Show 3 thumbnails
- Swipe left/right → carousel moves
- Tap thumbnail → main updates
- Swipe on main image → next/prev
```

### Component: ReviewList

```
ReviewList
│
├─ SortControl
│  ├─ "Newest" button
│  └─ "Highest rating" button
│
├─ ReviewSummary (mini)
│  ├─ Average rating
│  └─ Total count
│
└─ ReviewCards (approved only)
   ├─ ReviewCard
   │  ├─ VerifiedPurchaseBadge (always if order_id present)
   │  ├─ StarRating (1-5 filled stars)
   │  ├─ Author (first name + initial)
   │  ├─ ReviewDate ("3 days ago")
   │  ├─ ReviewText (truncate if too long)
   │  ├─ ReviewImages (grid, max 3)
   │  └─ Helpful buttons (optional, no voting counts shown)
   │
   └─ EmptyState (if no approved reviews)
      └─ "No reviews yet. Be first to review!"
```

## Data Flow

### Review Submission

```
Customer clicks "Write Review"
    ↓
ReviewWriteModal opens
- Product ID pre-filled
- Order ID lookup (verified purchase check)
    ↓
Customer fills:
- Star rating (1-5) [required]
- Title [optional]
- Text [optional]
- Images [optional, up to 3]
    ↓
Submit
    ↓
Review created with status='pending'
Points awarded immediately:
- +5 for text
- +2 for each image (max 2 images = +2)
    ↓
Page updated, notification: "+5 points earned!"
    ↓
Admin sees review in /admin/reviews (status='pending')
Admin can:
- Approve (status='approved') → shows on storefront
- Hide (status='hidden') → doesn't show, points kept
- Delete → soft delete, points kept
```

### Points Display (Customer vs Admin)

```
Customer sees:
├─ Available: 2,450 포인트
├─ Pending: 850 포인트 (next order)
├─ Tier progress: "Gold까지 1,500 포인트"
└─ Ledger:
   ├─ 주문 #1234 적립 (+850)
   ├─ 리뷰 작성 (+5)
   └─ 사진 포함 (+2)

Admin ONLY sees (in /admin/points):
├─ Tier thresholds (1M, 3M, 10M)
├─ Multipliers (Bronze 1x, Silver 1.2x, Gold 1.5x, VIP 2x)
├─ Review reward settings
├─ Manual adjustment UI
└─ Full moderation history
```

### Multi-Image Upload (Admin Products)

```
Admin goes to /admin/products/[id]
    ↓
Drag-drop zone (or click to upload)
    ↓
Select multiple images
    ↓
Preview grid shows:
├─ Image 1 [Featured] [Move ↑↓] [Delete]
├─ Image 2 [    ] [Move ↑↓] [Delete]
└─ Image 3 [    ] [Move ↑↓] [Delete]
    ↓
Admin reorders via drag or move buttons
    ↓
Set featured image (radio button)
    ↓
Save
    ↓
Images appear in storefront gallery
(Image 1 as main by default)
```

## Spacing Reference

### Account Dashboard (Key Measurements)

```
Mobile (375px viewport):
┌─────────────────────────────────┐
│ ProfileSection                  │
│ padding: 24px                   │
└─────────────────────────────────┘
        ↓ gap: 24px ↓
┌─────────────────────────────────┐
│ PointsCard                      │
│ padding: 24px                   │
└─────────────────────────────────┘
        ↓ gap: 24px ↓
┌─────────────────────────────────┐
│ SavedAddresses                  │
│ padding: 24px                   │
└─────────────────────────────────┘
        ↓ gap: 24px ↓
┌─────────────────────────────────┐
│ RecentOrders                    │
│ padding: 24px                   │
└─────────────────────────────────┘

Desktop (1200px+ viewport):
┌───────────────────────────────────────┐
│ ProfileSection                        │
│ padding: 32px                         │
└───────────────────────────────────────┘
        ↓ gap: 28-32px ↓
┌───────────────────────────────────────┐
│ PointsCard                            │
│ padding: 32px                         │
└───────────────────────────────────────┘
(etc.)
```

## Color & Texture Application

### Allowed Uses (Wood Texture)

```
✅ Footer top border (thin line, opacity 0.02-0.03)
✅ Hero section bottom (subtle banner)
✅ Brand intro section background
✅ PointsCard very subtle background

❌ Form inputs
❌ Admin tables
❌ Order lists
❌ Text-heavy areas (conflicts with readability)
❌ Navigation areas
```

### Color Tokens (Existing - No Changes)

```
Primary: #8B5E34 (wood brown)
Secondary: #E8D9C5 (light sand)
Background: #FFFBF5 (cream)
Foreground: #111827 (dark)
Muted: #F5EDE0 (very light sand)
Muted text: #6B7280 (gray)
Success: #2E7D32 (green)
Danger: #B42318 (red)
```

## Testing Scenarios

### Scenario 1: Customer Writes Review (with image)
1. Navigate to /shop/[slug]
2. Scroll to "Write Review" button
3. Click → ReviewWriteModal opens
4. Select 5 stars
5. Enter title + text
6. Upload 1 image
7. Click Submit
8. Points awarded: +5 (text) +2 (image) = 7 total
9. Modal closes
10. Page shows "Review added! +7 points earned"
11. Review appears in list (if auto-approved) or pending badge if moderation

### Scenario 2: Admin Moderates Review
1. Navigate to /admin/reviews
2. Filter: status = pending
3. See review with text, image, rating
4. Click "Approve"
5. Review moves to approved
6. Storefront shows review (after cache clear)
7. Points remain (already awarded)

### Scenario 3: Account Spacing Looks Good
1. Navigate to /account
2. Verify each section has 24px gap (mobile)
3. Each card has 24px padding
4. Sections feel spacious, not cramped
5. Resize to desktop → gaps increase to 28-32px

### Scenario 4: Product Gallery Works
1. Navigate to /shop/[slug]
2. See main image + 5 thumbnails
3. Click thumbnail 3 → main updates
4. Swipe left on main → next image
5. On mobile, drag thumbnail carousel left
6. All images load without distortion

### Scenario 5: Footer Compliance Check
1. Scroll to footer
2. Verify sections: Company | Customer | Legal
3. See company name, tax ID, address, phone, email
4. See links to FAQ, delivery, contact, terms, privacy, refund
5. See SNS links (Facebook, Instagram, etc.)
6. See Bộ Công Thương badge area
7. Click badge → opens external page (if URL present)
8. Mobile: accordion or stacked layout works

---

Done! All architecture, spacing, and component layouts are specified and ready for implementation.
