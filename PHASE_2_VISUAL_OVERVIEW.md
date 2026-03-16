# PHASE 2 VISUAL OVERVIEW
## Jin Jang's Kitchen - What's Changing

---

## BEFORE vs AFTER

### Product Detail Page (/shop/[slug])

**BEFORE**:
```
┌─────────────────────────┐
│    Single Image         │
│   (no gallery)          │
└─────────────────────────┘
Base Price: 85,000 VND

□ Option Group 1
○ Option A
○ Option B

[Add to Cart · 85,000 VND]
```

**AFTER**:
```
┌──────────────────────────────┬──────────────┐
│                              │  ┌──────────┐│
│  Main Image Gallery          │  │ Thumb 1  ││
│  (swipe/tap thumbnails)      │  ├──────────┤│
│                              │  │ Thumb 2  ││
│                              │  ├──────────┤│
│                              │  │ Thumb 3  ││
│                              │  └──────────┘│
└──────────────────────────────┴──────────────┘

⭐ 인기 | 🎁 선물추천 | 🚚 근거리배송

기본 가격: 85,000 VND
(옵션 선택 시 가격 변동)

필수 · 맵기 조절
  ○ 순한맛 (+ 0 VND)
  ○ 보통 (+ 0 VND)
  ● 매운맛 (+ 0 VND)

선택 · 추가 토핑
  ☐ 두부 추가 (+ 10,000 VND)
  ☑ 돼지고기 추가 (+ 25,000 VND)
  ☐ 계란 추가 (+ 8,000 VND)
     (품절)

특별 요청 사항
[텍스트 입력...]

수량: [−] 1 [+]

[Add to Cart · 108,000 VND]

┌─────────────────────────────┐
│ 보관 방법                     │
│ 냉장 2일, 냉동 30일          │
│                             │
│ 알러지                       │
│ 새우, 우유                   │
│                             │
│ 원재료                       │
│ 돼지고기, 고추, 소금...       │
│                             │
│ 중량: 300g | 유통기한: 2일   │
└─────────────────────────────┘

같이 먹으면 좋은 메뉴
[Product Card] [Product Card] [Product Card]
```

---

### Account Page (/account)

**BEFORE** (cramped):
```
┌─────────────────────┐
│ 주문 내역           │
│ [표]                │
│ 포인트              │
│ Balance: 1,250      │
│ 계정 설정           │
│ [링크]              │
└─────────────────────┘
```

**AFTER** (breathing room):
```
┌──────────────────────┐
│ 주문 내역             │
│ 최근 3건              │
│ [주문 카드]          │
│ [주문 카드]          │
│ [주문 카드]          │
└──────────────────────┘

[24px gap]

┌──────────────────────┐
│ 포인트                │
│ 잔액: 1,250포인트    │
│ 총 적립: 5,000포인트 │
│ [자세히 보기]        │
└──────────────────────┘

[24px gap]

┌──────────────────────┐
│ 저장된 주소          │
│ [주소 카드]          │
│ [주소 카드]          │
└──────────────────────┘

[24px gap]

┌──────────────────────┐
│ 계정 설정            │
│ [설정 옵션]          │
│ [설정 옵션]          │
└──────────────────────┘
```

---

### Points Page (NEW) (/account/points)

```
┌────────────────────────────────┐
│ 포인트 잔액                     │
│ 1,250포인트                    │
│ 총 적립: 5,000포인트           │
│ [자세히 보기]                  │
└────────────────────────────────┘

[탭] 잔액 조회 | 적립/사용 내역 (ACTIVE)

┌─ 필터 ──────────────────────┐
│ [전체] [적립] [사용] [만료] │
└─────────────────────────────┘

적립/사용 내역
┌──────────┬──────────┬────────┬──────────────┐
│ 날짜     │ 유형     │ 포인트 │ 잔액        │
├──────────┼──────────┼────────┼──────────────┤
│ 03/07    │ ✓ 적립   │ +250   │ 1,250      │
│ 03/06    │ ✗ 사용   │ -500   │ 1,000      │
│ 03/05    │ ✓ 적립   │ +300   │ 1,500      │
│ 02/15    │ ⏱ 만료   │ -100   │ 1,200      │
└──────────┴──────────┴────────┴──────────────┘
```

---

### Admin Products Page (/admin/products)

**BEFORE** (minimal):
```
┌──────────────┐
│ [이미지 URL] │
│ [이름]       │
│ [설명]       │
│ [카테고리]   │
│ [가격]       │
│ [저장]       │
└──────────────┘
```

**AFTER** (comprehensive):
```
┌────────────────────────────────┐
│ 기본 정보                       │
│ 메뉴 이름: [______]             │
│ 설명: [____________]            │
│ 카테고리: [Dropdown]            │
│ 가격: [______] VND              │
└────────────────────────────────┘

[Divider]

┌────────────────────────────────┐
│ 이미지 (⭐ = 대표 이미지)      │
│                                │
│ [Drag & Drop Zone]             │
│                                │
│ Gallery:                        │
│ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │Img 1 │ │Img 2 │ │[+]   │    │
│ │⭐    │ │⭐btn │ │upload│    │
│ │ ⋮    │ │ ⋮    │ │      │    │
│ └──────┘ └──────┘ └──────┘    │
└────────────────────────────────┘

[Divider]

┌────────────────────────────────┐
│ 옵션 관리                       │
│                                │
│ [+ 옵션 그룹 추가]              │
│                                │
│ ━━━━ 맵기 조절 ━━━━           │
│ 필수 | 단일 선택               │
│                                │
│ [+ 옵션값 추가]                │
│                                │
│ ┌──────────────────────────┐  │
│ │ 순한맛                   │  │
│ │ [가격 미적용]  [☒ 사용] │  │
│ │ [삭제]                   │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ 보통                     │  │
│ │ [가격 미적용]  [☒ 사용] │  │
│ │ [삭제]                   │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ 매운맛                   │  │
│ │ [가격 미적용]  [☒ 사용] │  │
│ │ [삭제]                   │  │
│ └──────────────────────────┘  │
└────────────────────────────────┘

[Divider]

┌────────────────────────────────┐
│ 식품 정보                       │
│                                │
│ 보관 방법: [____________]        │
│ 알러지: [tag] [tag] [+add]     │
│ 원재료: [____________]         │
│ 중량 (g): [____]               │
│ 유통기한 (일): [__]            │
│ 주의사항: [____________]        │
└────────────────────────────────┘

[Divider]

┌────────────────────────────────┐
│ 뱃지                            │
│                                │
│ ☐ 인기                         │
│ ☐ 입문추천                     │
│ ☐ 선물추천                     │
│ ☑ 근거리배송                   │
│ ☐ 냉장배송                     │
│ ☐ 전국배송 준비중              │
└────────────────────────────────┘

[저장] [취소]
```

---

## NEW COMPONENTS HIERARCHY

```
ProductImageGallery
├─ Main Image (fill, responsive)
├─ Thumbnail List
│  ├─ Thumbnail (mobile horizontal scroll)
│  └─ Thumbnail (desktop sidebar)
└─ Navigation (dots, arrows)

ProductOptionSelector (×N per group)
├─ Label + Badge (required/optional)
├─ RadioGroup (if single_select)
│  ├─ RadioGroupItem
│  ├─ Image (optional)
│  ├─ Name
│  └─ Price Delta (if applies)
└─ CheckboxGroup (if multi-select)
   ├─ Checkbox
   ├─ Image (optional)
   ├─ Name
   ├─ Price Delta
   └─ Count Indicator

PointsCard
├─ Large Balance Number
├─ Summary Text
├─ Progress Bar (optional)
└─ View Details Button

PointsLedgerTable
├─ Filter Dropdown (type: all/earn/redeem/expire)
├─ Sort Controls
└─ Table
   ├─ Date | Type Icon | Amount | Balance | Description

AdminProductImageUpload
├─ Drag-Drop Zone
├─ File Input
├─ Preview Grid
│  ├─ Image Preview
│  ├─ Set as Featured Radio
│  ├─ Drag Handle
│  └─ Delete Button
└─ Upload Status
```

---

## DATA FLOW

### Product Detail Page
```
MOCK_PRODUCTS
    ↓
Product {
  images: ProductImage[]
  option_groups: ProductOptionGroup[] {
    option_values: ProductOptionValue[] {
      price_rule: ProductOptionPriceRule
    }
  }
}
    ↓
ProductImageGallery (activeImageId state)
ProductOptionSelector (selectedOptions state)
    ↓
Real-time calculation:
  optionsTotal = sum(selected options' price_deltas)
  unitPrice = basePrice + optionsTotal
  totalPrice = unitPrice × quantity
    ↓
AddToCart button displays totalPrice
```

### Points Page
```
MOCK_POINTS_CONFIG + MOCK_POINTS_TRANSACTIONS
    ↓
PointsCard {
  balance: 1,250
  totalEarned: 5,000
}
    ↓
Tabs [Balance | Ledger]
    ↓
PointsLedgerTable {
  transactions: filtered by type
  sorted by date desc
  running balance calculated
}
```

---

## MOBILE DESIGN NOTES

### Gallery (Mobile)
- Main image: full width, maintains aspect ratio
- Thumbnails: horizontal scroll below, 4-5 visible
- Tap thumbnail = swap main image
- Swipe on main image = navigate thumbnails (optional)

### Options (Mobile)
- Full width cards
- Stack vertically
- Radio/checkbox aligned left
- Price info right-aligned
- Touch target min 48px height

### Spacing (Mobile)
- Between sections: 24px (gap-6)
- Card padding: 16px (p-4)
- Section headings: 12px bottom margin
- Field label bottom: 8px

### Account Page (Mobile)
- Single column
- Cards full width
- Section separator: divider line
- Each section: card container
- Bottom button: sticky or inline

---

## DESIGN SYSTEM

### Colors (No Changes)
- Primary: #8B5E34 (wood)
- Secondary: #E8D9C5 (cream)
- Muted: #6B7280
- Success: #2E7D32
- Destructive: #B42318

### Wood Texture
- Background opacity: 0.02-0.03
- Applied to: Section dividers, food info backgrounds, admin headers
- NOT applied to: Data tables, image galleries, form inputs, cards

### Spacing Scale
- xs: 4px (0.25rem)
- sm: 8px (0.5rem)
- md: 12px (0.75rem)
- base: 16px (1rem)
- lg: 24px (1.5rem) ← Mobile section gap
- xl: 32px (2rem) ← Desktop section gap

### Typography (No Changes)
- Headings: Existing sizes
- Body: Existing sizes
- Monospace: Existing

---

## TESTING SCENARIOS

### Scenario 1: Gallery Navigation (Mobile)
1. Open product detail
2. See main image + 4 thumbnails
3. Tap thumbnail → main image swaps
4. Scroll thumbnails → reveal more
5. ✓ No layout shifts
6. ✓ Smooth transitions

### Scenario 2: Option Selection
1. Required option pre-selected
2. Change selection → price updates
3. Add optional items → count shows "2/3"
4. At max → disable further checkboxes
5. ✓ Price changes immediately in CTA button

### Scenario 3: Points Ledger
1. Open /account/points
2. Tab to "적립/사용 내역"
3. Apply filter: "적립만 보기"
4. ✓ Shows only earn transactions
5. ✓ Running balance accurate
6. ✓ Newest first

### Scenario 4: Admin Product Upload
1. Click "+ 상품 추가"
2. Drag 3 images to upload zone
3. Verify preview grid shows 3 images
4. Click image 2 "대표 이미지" radio
5. Drag image 2 → image 1 position
6. ✓ Display order updates
7. ✓ Featured indicator moves with image

---

END VISUAL OVERVIEW
