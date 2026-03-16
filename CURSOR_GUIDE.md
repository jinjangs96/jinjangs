# CURSOR/CODEX IMPLEMENTATION GUIDE
## Jin Jang's Kitchen - Phase 2 Enhancements

This guide provides copy-paste ready instructions and code structure for implementing multi-image, options, points, and UX enhancements.

---

## PART A: NEW COMPONENTS TO CREATE

### 1. ProductImageGallery.tsx
**Path**: `components/storefront/product-image-gallery.tsx`

**Props Interface**:
```typescript
interface ProductImageGalleryProps {
  images: ProductImage[]
  productName: string
  activeImageId?: string
  onImageChange?: (imageId: string) => void
}
```

**Features to Implement**:
- Render main large image (centered, full width)
- Below main: horizontal scrollable thumbnail bar (mobile), fixed sidebar (desktop)
- Thumbnail highlights active
- Click thumbnail = swap main image
- Pinch-zoom hint on mobile ("두 손가락으로 확대 가능")
- Keyboard arrow navigation (optional)
- Smooth fade transitions between images

**Key Implementation Notes**:
- Use Next.js Image component with `fill` and `object-cover`
- Main image: `aspect-square` on mobile, adjust for desktop
- Thumbnails: `w-20 h-20` with `rounded-lg`
- Use horizontal scroll with `overflow-x-auto` for mobile thumbnails
- Desktop: Use CSS Grid sidebar layout, `grid-cols-[1fr_100px]`

---

### 2. ProductOptionSelector.tsx
**Path**: `components/storefront/product-option-selector.tsx`

**Props Interface**:
```typescript
interface ProductOptionSelectorProps {
  optionGroup: ProductOptionGroup
  selectedValue: string | string[] | undefined
  onChange: (value: string | string[]) => void
}
```

**Logic**:
- If `single_select=true`: Render RadioGroup with custom card styling
- If `single_select=false`: Render Checkbox group with custom card styling
- For each option value:
  - Show name + image (optional thumbnail)
  - Show price if `apply_price_delta=true` (e.g., "+ 10,000 VND")
  - Show disabled state if `is_available=false`
  - Show count for multi-select ("선택 N/M")
- Render "필수" badge if `required=true`
- Prevent exceeding `max_select`

**Styling**:
- Card: `p-3 rounded-xl border border-border cursor-pointer transition-colors`
- Active: `border-primary bg-primary/5`
- Hover: `border-primary/50`

---

### 3. PointsCard.tsx
**Path**: `components/storefront/points-card.tsx`

**Props Interface**:
```typescript
interface PointsCardProps {
  balance: number
  totalEarned: number
  onViewDetails: () => void
}
```

**Display**:
- Large balance number (e.g., "1,250포인트")
- Subtitle: "총 적립 5,000포인트"
- Progress bar (optional, for MVP1 just show balance)
- "자세히 보기" button links to `/account/points`

---

### 4. PointsLedgerTable.tsx
**Path**: `components/storefront/points-ledger-table.tsx`

**Props Interface**:
```typescript
interface PointsLedgerTableProps {
  transactions: PointsTransaction[]
  currentBalance: number
}
```

**Columns** (responsive):
- Date (MM/DD format)
- Type icon + description (Earn: ✓ green, Redeem: ✗ red, Expire: ⏱)
- Amount (signed: +1000 or -500)
- Running balance
- Order reference (if applicable)

**Mobile**: Show simplified table (hide balance column, show as right align only)

---

### 5. AdminProductImageUpload.tsx
**Path**: `components/admin/product-image-upload.tsx`

**Props Interface**:
```typescript
interface AdminProductImageUploadProps {
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
  productId: string
}
```

**Features**:
- Drag-drop zone with "drop images here or click"
- Accept multiple files
- Show preview grid after selection
- Per-image controls:
  - "Set as Featured" button (radio, only 1 featured)
  - Delete button
  - Drag handle for reorder
- Display order auto-numbering after reorder

---

## PART B: ENHANCED COMPONENTS

### 1. ProductCard.tsx
**Path**: `components/storefront/product-card.tsx`

**Updates**:
- Change `image_url` to use `images[0]` if available, else fallback to `image_url`
- Render badge grid at top (if `badges` length > 0)
- If product has options, show subtle "옵션 있음" indicator at bottom

---

## PART C: PAGES TO ENHANCE

### 1. /shop/[slug]/page.tsx
**Enhancements**:
```typescript
// State additions
const [activeImageId, setActiveImageId] = useState<string>('')
const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({})
const [quantity, setQuantity] = useState(1)
const [specialRequest, setSpecialRequest] = useState('')

// Initialize
useEffect(() => {
  if (product?.images && product.images.length > 0) {
    setActiveImageId(product.images.find(img => img.is_featured)?.id || product.images[0].id)
  }
  // Initialize required options
  const initial: Record<string, string | string[]> = {}
  product?.option_groups.forEach(group => {
    if (group.required) {
      if (group.single_select) {
        initial[group.id] = group.option_values[0]?.id || ''
      } else {
        initial[group.id] = []
      }
    } else {
      initial[group.id] = group.single_select ? '' : []
    }
  })
  setSelectedOptions(initial)
}, [product])

// Real-time price calculation
const optionsTotal = useMemo(() => {
  let total = 0
  product?.option_groups.forEach(group => {
    const selected = selectedOptions[group.id]
    if (Array.isArray(selected)) {
      selected.forEach(optId => {
        const opt = group.option_values.find(o => o.id === optId)
        if (opt?.price_rule.apply_price_delta) {
          total += opt.price_rule.price_delta_vnd
        }
      })
    } else if (selected) {
      const opt = group.option_values.find(o => o.id === selected)
      if (opt?.price_rule.apply_price_delta) {
        total += opt.price_rule.price_delta_vnd
      }
    }
  })
  return total
}, [selectedOptions, product])

const unitPrice = (product?.base_price_vnd || 0) + optionsTotal
const totalPrice = unitPrice * quantity
```

**New Layout Sections** (in order):
1. ProductImageGallery (left mobile, full width; top left desktop)
2. Details section (right mobile, top right desktop) with:
   - Product name, description
   - Badges (if any)
   - Base price + "(옵션 선택 시 가격 변동)" note
3. ProductOptionSelector for each group
4. Special requests textarea
5. Quantity controls
6. "Add to Cart" button with totalPrice
7. **[NEW]** Food Information section (collapsible or always visible):
   ```
   보관 방법: {product.storage_instructions}
   알러지: {product.allergens.join(', ')}
   원재료: {product.ingredients}
   중량: {product.weight_g}g
   유통기한: {product.shelf_life_days}일
   ```
   (Only show fields that exist)

8. **[NEW]** "같이 먹으면 좋은 메뉴" section (optional for MVP1)
   - Show 3-4 related products from same or nearby category
   - Use existing ProductCard component

**Styling Notes**:
- Mobile stack: image full width, then details below
- Desktop grid: `grid-cols-2 gap-8`
- Food info section: `bg-muted p-4 rounded-xl` with subtle wood texture if desired
- Warnings: Use Alert component if present

---

### 2. /account/points/page.tsx
**Create/Enhance**:
```typescript
// Assume user is logged in, fetch data (mock for now)
const [tab, setTab] = useState<'balance' | 'ledger'>('balance')
const [filterType, setFilterType] = useState<'all' | 'earn' | 'redeem' | 'expire'>('all')

const currentBalance = 1250  // Mock
const totalEarned = 5000
const totalRedeemed = 3750

const filteredTransactions = MOCK_POINTS_TRANSACTIONS
  .filter(t => filterType === 'all' ? true : t.type === filterType)
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
```

**Layout**:
- Top: Large balance card (PointsCard component)
- Tabs: "잔액 조회" | "적립/사용 내역"
- Tab 1: Balance summary + summary stats
- Tab 2: PointsLedgerTable with filter dropdown
- Mobile: Vertical stack, full-width cards, `gap-6 py-4`
- Desktop: `gap-8 py-6`

---

### 3. /admin/products/page.tsx
**Enhancements**:
- Add AdminProductImageUpload component to edit dialog
- Add "옵션 관리" collapsible section in edit form
- Add food information section in edit form
- Add badges multi-select checkboxes

**Edit Dialog Structure**:
```typescript
<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
  <section>
    <h3>기본 정보</h3>
    {/* name, desc, category, price, existing fields */}
  </section>
  
  <section>
    <h3>이미지</h3>
    <AdminProductImageUpload {...props} />
  </section>
  
  <section>
    <h3>옵션 관리</h3>
    {/* Option group editor */}
  </section>
  
  <section>
    <h3>식품 정보</h3>
    {/* Storage, allergens, ingredients, etc. */}
  </section>
  
  <section>
    <h3>뱃지</h3>
    {/* Multi-select checkboxes */}
  </section>
  
  <DialogFooter>
    {/* Save/Cancel buttons */}
  </DialogFooter>
</DialogContent>
```

---

## PART D: MOCK DATA UPDATES

### Update MOCK_PRODUCTS in lib/mock-data.ts
Replace each product's structure. Example for 김치찌개:
```typescript
{
  id: 'prod-001',
  slug: 'kimchi-jjigae',
  name_ko: '김치찌개',
  desc_ko: '돼지고기와 숙성 김치로 끓인 진한 찌개',
  category: 'main',
  base_price_vnd: 85000,
  image_url: 'https://images.unsplash.com/...',  // Keep for compat
  images: [
    { id: 'img-001', product_id: 'prod-001', url: '...', alt_text: '김치찌개 메인', is_featured: true, display_order: 0, uploaded_at: '2026-01-01T00:00:00Z' },
    { id: 'img-002', product_id: 'prod-001', url: '...', alt_text: '김치찌개 접근샷', is_featured: false, display_order: 1, uploaded_at: '2026-01-01T00:00:00Z' },
  ],
  storage_instructions: '냉장 2일, 냉동 30일',
  allergens: ['새우', '우유'],
  ingredients: '돼지고기, 고추, 소금, 고추장',
  weight_g: 300,
  shelf_life_days: 2,
  food_warnings: undefined,
  badges: ['popular'],
  option_groups: [
    {
      id: 'og-spicy',
      product_id: 'prod-001',
      name_ko: '맵기 조절',
      required: true,
      single_select: true,
      min_select: 1,
      max_select: 1,
      display_order: 0,
      option_values: [
        { id: 'ov-mild', option_group_id: 'og-spicy', name_ko: '순한맛', display_order: 0, is_available: true, price_rule: { apply_price_delta: false, price_delta_vnd: 0 }, image_url: undefined },
        { id: 'ov-medium', option_group_id: 'og-spicy', name_ko: '보통', display_order: 1, is_available: true, price_rule: { apply_price_delta: false, price_delta_vnd: 0 }, image_url: undefined },
        { id: 'ov-hot', option_group_id: 'og-spicy', name_ko: '매운맛', display_order: 2, is_available: true, price_rule: { apply_price_delta: false, price_delta_vnd: 0 }, image_url: undefined },
      ],
    },
    {
      id: 'og-extra',
      product_id: 'prod-001',
      name_ko: '추가 토핑',
      required: false,
      single_select: false,
      min_select: 0,
      max_select: 3,
      display_order: 1,
      option_values: [
        { id: 'ov-tofu', option_group_id: 'og-extra', name_ko: '두부 추가', display_order: 0, is_available: true, price_rule: { apply_price_delta: true, price_delta_vnd: 10000 } },
        { id: 'ov-pork', option_group_id: 'og-extra', name_ko: '돼지고기 추가', display_order: 1, is_available: true, price_rule: { apply_price_delta: true, price_delta_vnd: 25000 } },
        { id: 'ov-egg', option_group_id: 'og-extra', name_ko: '계란 추가', display_order: 2, is_available: false, price_rule: { apply_price_delta: true, price_delta_vnd: 8000 } },
      ],
    },
  ],
  is_available: true,
  is_popular: true,
  sort_order: 1,
  created_at: '2026-01-01T00:00:00Z',
}
```

### Add MOCK_POINTS_CONFIG
```typescript
export const MOCK_POINTS_CONFIG: PointsConfig = {
  points_per_vnd: 0.0001,        // 1 point per 10,000 VND
  min_order_to_earn_vnd: 50000,
  min_points_to_redeem: 50,
  max_redeem_percent: 30,
  expiry_months: 12,
  first_purchase_bonus_points: 100,
}
```

### Add MOCK_POINTS_TRANSACTIONS (sample)
```typescript
export const MOCK_POINTS_TRANSACTIONS: PointsTransaction[] = [
  {
    id: 'pt-001',
    member_phone: '090-1234-5678',
    type: 'earn',
    points_amount: 250,
    balance_after: 1250,
    description: '주문 #1001 적립 (250k VND × 0.1%)',
    order_id: 'ord-001',
    created_at: '2026-03-07T08:15:00Z',
  },
  // ... more transactions
]
```

---

## PART E: STYLING & SPACING FIXES

### Update app/(storefront)/account/page.tsx Sections
Each section should have:
```typescript
// Mobile spacing
<div className="py-6 px-4 space-y-6">
  <Card>
    {/* Section content */}
  </Card>
</div>

// Desktop spacing
md:py-8 md:px-6 md:space-y-8
```

### Add Wood Texture to globals.css
Add new CSS variable + utility:
```css
:root {
  /* ... existing ... */
  --wood-texture-opacity: 0.02;
  --wood-texture-url: url('data:image/svg+xml,...');  /* subtle wood pattern SVG */
}

.wood-texture {
  background-image: var(--wood-texture-url);
  opacity: var(--wood-texture-opacity);
}
```

Use sparingly on:
- Food info section background
- Section dividers
- Admin form headers
- NOT on cards, tables, galleries, forms

---

## PART F: VERIFICATION CHECKLIST

After implementing, verify:

- [ ] ProductImageGallery works on mobile (swipe/tap thumbnails)
- [ ] Option selection updates price in real-time in "Add to Cart" button
- [ ] Required options default selected on page load
- [ ] Multi-select options show count ("2/3 selected") and disable at max
- [ ] Food info only shows fields that exist (no empty sections)
- [ ] Points ledger shows running balance correctly
- [ ] Wood texture doesn't appear on images or data tables
- [ ] /account spacing: 24px gap mobile, 32px desktop
- [ ] Admin product form saves all new fields
- [ ] Image reorder in admin product form persists
- [ ] Mobile: sticky "Add to Cart" button or scrolls nicely
- [ ] Admin: option group editor prevents required field validation bugs

---

## PART G: MIGRATION NOTES

### Backward Compatibility During Transition
- Keep `Product.image_url` populated from `images[0]` for now
- Keep old `ProductOption` type in types.ts (deprecated comment)
- Existing code continues to work; new code uses `ProductOptionValue`
- When transitioning existing products: Run data migration to populate `images` array from single `image_url`

### Future: Payment Integration
- Don't implement yet, mark MegaPay as "예정" in UI
- Points can't be used yet for payment (structure ready, but no checkout logic)
- Placeholder for payment method in checkout: show "은행 계좌 이체" + "QR 결제" only

---

END GUIDE
