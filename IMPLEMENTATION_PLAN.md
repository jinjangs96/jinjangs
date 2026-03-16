# Jin Jang's Kitchen - Implementation Plan
## Advanced Features: Images, Options, Points, UX

This document structures the next phase of enhancements. Implementation should maintain existing structure while extending types, components, and pages.

---

## 1. UPDATED ROUTE/SECTIONS

### New/Modified Routes
- `/admin/products` — Enhanced with multi-image, options, food info
- `/shop/[slug]` — Enhanced product detail with gallery, food info, recommendations
- `/account/points` — NEW page for points balance and transaction ledger

### No New Routes Required
- All storefront pages remain the same
- All admin pages remain the same
- Gallery is in-page carousel on `/shop/[slug]`

---

## 2. WHY THESE ADDITIONS ARE NEEDED

### Problem: Single Image Limitation
**Current**: One `image_url` per product blocks gallery functionality
**Solution**: Support featured + gallery images for visual browsing

### Problem: Limited Options
**Current**: Fixed `price_delta_vnd` in options, no image variants
**Solution**: Make options more flexible: pricing on/off, option-specific images, pricing rules

### Problem: No Points System
**Current**: PointsPolicy exists in types but no UI or ledger tracking
**Solution**: Implement simple MVP points (10k VND = 1pt, 50pt = 50k discount)

### Problem: Account Page Cramped
**Current**: Sections squeeze together without breathing room
**Solution**: Add vertical spacing (24px mobile, 32px desktop), card separation

---

## 3. DATA MODEL ADDITIONS

### NEW TYPE: ProductImage
```typescript
export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string
  is_featured: boolean      // true = main image on list/hero
  display_order: number     // 0,1,2...for gallery order
  uploaded_at: string
}
```

### NEW TYPE: ProductOptionValue
```typescript
export interface ProductOptionValue {
  id: string
  option_group_id: string
  name_ko: string
  display_order: number
  is_available: boolean
  // Price rule
  price_rule: ProductOptionPriceRule
  // Optional: Image tied to this option (e.g., meat cut, topping)
  image_url?: string
}

export interface ProductOptionPriceRule {
  apply_price_delta: boolean    // true/false toggle
  price_delta_vnd: number       // null when apply_price_delta=false
}
```

### NEW TYPE: ProductOptionGroup (UPDATED)
```typescript
export interface ProductOptionGroup {
  id: string
  product_id: string
  name_ko: string
  required: boolean
  single_select: boolean             // true = radio, false = checkbox
  min_select: number                 // 0 for optional
  max_select: number                 // 1 for radio, N for checkbox
  display_order: number
  option_values: ProductOptionValue[]
}
```

### UPDATED TYPE: Product
```typescript
export interface Product {
  id: string
  slug: string
  name_ko: string
  desc_ko: string
  category: ProductCategory
  base_price_vnd: number
  
  // IMAGE CHANGES
  image_url: string              // KEEP for backward compat, = featured image
  images: ProductImage[]         // NEW: multi-image support
  
  // OPTION CHANGES
  option_groups: ProductOptionGroup[]  // UPDATED structure
  
  // NEW: Food Information
  storage_instructions?: string  // "냉장 2일, 냉동 30일"
  allergens?: string[]           // ["새우", "우유"]
  ingredients?: string           // "돼지고기, 고추, 소금..."
  weight_g?: number              // 300
  shelf_life_days?: number       // 2
  food_warnings?: string         // "생식주의" or "해산물 주의"
  
  // BADGES
  badges: ProductBadge[]         // ['popular', 'local_delivery', 'gift_recommended']
  
  is_available: boolean
  is_popular: boolean
  sort_order: number
  created_at: string
}

export type ProductBadge = 'popular' | 'beginner_friendly' | 'gift_recommended' 
  | 'local_delivery' | 'cold_shipping' | 'nationwide_coming'
```

### NEW TYPE: PointsConfig
```typescript
export interface PointsConfig {
  // Simple MVP Rules
  points_per_vnd: number         // 1 point per 10,000 VND = 0.0001
  min_order_to_earn_vnd: number  // e.g. 50,000
  min_points_to_redeem: number   // e.g. 50
  max_redeem_percent: number     // 30 = up to 30% of order via points
  expiry_months: number          // 12 months
  
  // Bonus
  first_purchase_bonus_points: number  // 0 if not used
}
```

### NEW TYPE: PointsTransaction
```typescript
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
```

---

## 4. COMPONENT ADDITIONS

### NEW: ProductImageGallery
- **Purpose**: Display featured + gallery images with thumbnails
- **Location**: `components/storefront/product-image-gallery.tsx`
- **Props**: 
  - `images: ProductImage[]`
  - `productName: string`
  - `onImageSelect?: (imageId: string) => void`
- **Features**:
  - Main large image (center)
  - Horizontal thumbnail scrollable list below (mobile)
  - Thumbnail sidebar (desktop, right of main)
  - Pinch-zoom hint on mobile
  - Active thumbnail highlight

### NEW: ProductOptionSelector
- **Purpose**: Render dynamic option UI based on group config
- **Location**: `components/storefront/product-option-selector.tsx`
- **Props**:
  - `optionGroup: ProductOptionGroup`
  - `selectedOptions: Record<string, string | string[]>`
  - `onChange: (groupId, value) => void`
- **Features**:
  - Radio cards for single-select
  - Checkbox cards for multi-select
  - Show price delta if applies
  - Show option image (thumbnail) if available
  - Required/optional badges
  - Disabled state for unavailable options

### NEW: PointsCard
- **Purpose**: Display user points balance and quick info
- **Location**: `components/storefront/points-card.tsx`
- **Props**:
  - `balance: number`
  - `totalEarned: number`
  - `nextTier?: string`
  - `onViewDetails: () => void`
- **Features**:
  - Large balance display
  - Progress bar to next tier (if applicable)
  - "View Details" button

### ENHANCED: ProductCard
- **Current**: Single image + price
- **Enhanced**:
  - Show featured image from `images` array
  - Multiple badges support
  - If options exist, show subtle indicator ("+ 옵션" or icon)

### NEW: PointsLedgerTable
- **Purpose**: Show transaction history
- **Location**: `components/storefront/points-ledger-table.tsx`
- **Props**:
  - `transactions: PointsTransaction[]`
  - `currentBalance: number`
- **Features**:
  - Earn/redeem/expire rows with icon
  - Amount (green for earn, red for redeem)
  - Running balance
  - Date
  - Description (order #, reason)

### NEW: AdminProductImageUpload
- **Purpose**: Drag-drop multi-image upload with preview
- **Location**: `components/admin/product-image-upload.tsx`
- **Props**:
  - `images: ProductImage[]`
  - `onImagesChange: (images: ProductImage[]) => void`
  - `productId: string`
- **Features**:
  - Drag & drop zone
  - Multiple file select
  - Preview grid
  - Reorder via drag handle
  - Set as featured button
  - Delete button per image
  - Progress indicators

---

## 5. PROPS PROPOSAL

### Product Detail Page State
```typescript
interface ProductDetailState {
  selectedImages: string[]           // gallery selection
  selectedOptions: Record<string, string | string[]>
  quantity: number
  specialRequest: string
  activeImageId: string              // currently displayed image
}
```

### Admin Product Form State
```typescript
interface AdminProductFormState {
  name_ko: string
  desc_ko: string
  category: ProductCategory
  base_price_vnd: number
  images: ProductImage[]
  
  storage_instructions: string
  allergens: string[]
  ingredients: string
  weight_g: number
  shelf_life_days: number
  food_warnings: string
  
  badges: ProductBadge[]
  is_available: boolean
  is_popular: boolean
  
  option_groups: ProductOptionGroup[]
}
```

### PointsAccount State
```typescript
interface PointsAccountState {
  currentBalance: number
  totalEarned: number
  totalRedeemed: number
  transactions: PointsTransaction[]
  loading: boolean
}
```

---

## 6. LOCAL STATE PROPOSAL

### `/shop/[slug]` Page
```typescript
const [activeImageId, setActiveImageId] = useState<string>('')
const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({})
const [quantity, setQuantity] = useState(1)
const [specialRequest, setSpecialRequest] = useState('')

// Compute real-time price
const totalPrice = useMemo(() => {
  let optionsTotal = 0
  product?.option_groups.forEach(group => {
    const selected = selectedOptions[group.id]
    // calc price delta from selected option_values
  })
  return (product.base_price_vnd + optionsTotal) * quantity
}, [selectedOptions, quantity, product])
```

### `/account/points` Page
```typescript
const [activeTab, setActiveTab] = useState<'balance' | 'ledger'>('balance')
const [filterType, setFilterType] = useState<'all' | 'earn' | 'redeem'>('all')
const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
```

### Admin Product Form
```typescript
const [formData, setFormData] = useState<AdminProductFormState>(initialData)
const [images, setImages] = useState<ProductImage[]>([])
const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>([])
const [isSubmitting, setIsSubmitting] = useState(false)
```

---

## 7. ADMIN FIELDS (Enhanced /admin/products)

### Product Edit Dialog / Page Additions
- **Images Section**:
  - Multi-file upload (drag & drop)
  - Gallery preview with drag-to-reorder
  - "Set as Featured" button
  - Delete button per image

- **Option Management**:
  - "+ Add Option Group" button
  - Per-group UI:
    - Name input
    - Radio/Checkbox toggle (single_select)
    - Min/Max select inputs
    - "+ Add Option Value" button
    - Per-value cards:
      - Name input
      - Availability toggle
      - "Apply Price" checkbox
      - Price delta input (shown only if checked)
      - Optional image upload for this value
      - Delete button

- **Food Information**:
  - Storage Instructions textarea
  - Allergens multi-select / tags
  - Ingredients textarea
  - Weight (g) number input
  - Shelf life (days) number input
  - Food Warnings textarea (or preset)
  
- **Badges**:
  - Multi-select checkboxes: Popular, Beginner Friendly, Gift Recommended, Local Delivery, Cold Shipping, Nationwide Coming Soon

---

## 8. STOREFRONT FIELDS (Enhanced /shop/[slug])

### Product Detail Page Sections
1. **Gallery Section** (NEW)
   - Large featured image + thumbnails below (mobile scroll)
   - Thumbnail sidebar (desktop)
   - Pinch zoom hint

2. **Basic Info** (EXISTING)
   - Name, description
   - Price (real-time updated with options)

3. **Badges** (NEW)
   - Inline badges for popular, local delivery, gift, etc.

4. **Option Selector** (ENHANCED)
   - Dynamic rendering per option group
   - Option images if available
   - Real-time price update
   - Required/optional labels clear

5. **Food Information** (NEW - collapsible section or below options)
   - Storage: "냉장 2일, 냉동 30일"
   - Allergens: Pill badges
   - Ingredients: Text
   - Weight & Shelf Life: Small text
   - Warnings: Alert box if present

6. **Quantity & Add to Cart** (EXISTING, enhanced with real-time price)

7. **Recommendations** (NEW - below fold, optional MVP1)
   - Show 3-4 related products in same category
   - "같이 먹으면 좋은 메뉴" heading

---

## 9. INTERACTION RULES

### Product Options
- When user selects an option:
  - If `apply_price_delta = true`, recalculate price immediately
  - Show "+ 10,000" next to option name
  - Total price updates in "Add to Cart" button
  - If option has `image_url`, optionally swap gallery main image (nice-to-have)

- Required options:
  - Default first value selected on page load
  - Cannot unselect
  - Form validation prevents cart addition if missing

- Multi-select options:
  - Show current count vs max ("선택 2/3")
  - Disable further selections when max reached
  - Show warning if max exceeded

### Gallery Navigation
- Mobile: Swipe left/right on main image or tap thumbnails
- Desktop: Click thumbnails (sidebar or center)
- Keyboard: Arrow left/right (optional)
- Smooth transitions between images

### Points
- On `/account/points`:
  - Default tab = Balance (big number, summary)
  - Tab = Ledger (transaction table)
  - Filter by earn/redeem/all
  - Sort by newest first
  - Show running balance per row

---

## 10. MOBILE RULES (Mobile-First Design)

### Product Detail
- Stack gallery + details vertically
- Gallery: Large main image, horizontal thumbnail scroll below
- Thumbnails: 4-5 visible at once, swipeable
- Options: Full-width cards, stacked
- Reduced font sizes for option prices
- Add to Cart button: Sticky bottom or inline (sticky on scroll)

### Account Points
- Full-width layout
- Balance card: Large, card-like container with padding
- Ledger: Simplified table (3 columns: date, type, amount)
- Scroll horizontally on very small screens

### Admin Product Form
- Mobile: Single column
- Image upload: Full-width preview grid
- Option groups: Accordion or collapsed sections
- Food info: Collapsible section
- Save button: Sticky bottom or large inline

---

## 11. DESIGN TOKENS & STYLING

### Color
- Keep existing wood-tone palette
- Use primary (#8B5E34) for highlights and CTAs
- Use secondary (#E8D9C5) for badge backgrounds
- Use muted (#6B7280) for secondary text

### Wood Texture
- Add subtle wood texture SVG/CSS to:
  - Section dividers (opacity: 0.03)
  - Food information section background (opacity: 0.02)
  - Admin page header background (opacity: 0.01)
- DO NOT add to cards, tables, or form inputs
- DO NOT add to image galleries (would interfere with photos)

### Spacing (Mobile-First)
- **Account Page**: 
  - Mobile: gap-6 (24px) between sections
  - Desktop: gap-8 (32px)
  - Each section: card-like container, px-4 py-4 (mobile), px-6 py-6 (desktop)

- **Product Detail**:
  - Gallery + info gap: gap-6 (mobile), gap-8 (desktop)
  - Within options: gap-3 per option group

### Typography
- Product name: 2xl (mobile), 3xl (desktop), font-bold
- Section headers: lg, font-semibold
- Option names: base, font-medium
- Prices: text-primary, font-bold

---

## 12. MVP1 vs MVP2

### MVP1 (Now)
- Multi-image gallery (no lazy load, all preload)
- Options system (single + multi-select, with pricing)
- Simple points system (earn: 10k VND = 1pt, redeem: 50pt = 50k discount)
- Points ledger UI (/account/points)
- Food information fields (text, no validation)
- Admin product image upload (drag-drop, simple)
- Option image support (structure only, UI optional)

### MVP2 (Future - Mark as "예정")
- MegaPay payment method
- Tier-based point multipliers (Bronze/Silver/Gold/VIP)
- Tier progression visualization
- Bonus points (seasonal, referral)
- Category-specific point rates
- Points expiry enforcement
- Lazy-load image gallery
- Option availability calendar (e.g., weekends only)

---

## 13. NOTES FOR CURSOR/CODEX

### File Changes Required
1. **lib/types.ts**
   - Add ProductImage, ProductOptionValue, ProductOptionGroup (updated), Product (updated), PointsConfig, PointsTransaction

2. **lib/mock-data.ts**
   - Update MOCK_PRODUCTS to use new Product structure with images array and enhanced option groups
   - Add MOCK_POINTS_CONFIG
   - Add MOCK_POINTS_TRANSACTIONS

3. **NEW: components/storefront/product-image-gallery.tsx**

4. **NEW: components/storefront/product-option-selector.tsx**

5. **NEW: components/storefront/points-card.tsx**

6. **NEW: components/storefront/points-ledger-table.tsx**

7. **NEW: components/admin/product-image-upload.tsx**

8. **EDIT: components/storefront/product-card.tsx**
   - Update to show featured image from images array
   - Support multiple badges

9. **EDIT: app/(storefront)/shop/[slug]/page.tsx**
   - Integrate ProductImageGallery
   - Integrate ProductOptionSelector
   - Add food information section
   - Add recommendations section (optional)
   - Real-time price calculation

10. **NEW: app/(storefront)/account/points/page.tsx** (already exists, enhance)
    - Add PointsCard component
    - Add PointsLedgerTable with filtering
    - Tab UI (Balance / Ledger)

11. **EDIT: app/admin/products/page.tsx**
    - Add AdminProductImageUpload component
    - Add option group management UI
    - Add food information fields
    - Add badges multi-select

12. **EDIT: app/globals.css**
    - Add subtle wood texture SVG/CSS variables
    - Define texture opacity values

### Implementation Priority
1. Types & mock data (foundation)
2. Components (reusable UI pieces)
3. Storefront pages (customer-facing)
4. Admin pages (operations)
5. Polish & testing (final pass)

### Key Consideration
- Maintain backward compatibility: Keep `image_url` in Product as the featured image URL
- Options pricing: Always check `apply_price_delta` before using `price_delta_vnd`
- Points: Simple MVP — don't over-engineer, just earn/redeem/track
- Mobile: Test gallery on iOS Safari (pinch zoom behavior)

### Testing Checklist
- [ ] Multi-image gallery swipe/tap on mobile
- [ ] Option selection updates price correctly
- [ ] Required options default + validation
- [ ] Points ledger shows correct running balance
- [ ] Admin upload handles multiple files
- [ ] Wood texture doesn't interfere with images/tables
- [ ] Mobile spacing feels breathable on all sections
- [ ] Admin option reordering works smoothly

---

## END PLAN

Implement in order, test as you go, and reference this document for any ambiguities.
