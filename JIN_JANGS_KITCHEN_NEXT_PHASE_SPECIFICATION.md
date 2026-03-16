# Jin Jang's Kitchen - Next Phase Specification

## 1. Executive Summary

Jin Jang's Kitchen는 호치민의 프리미엄 장요리 D2C + 근거리 포케 서비스입니다. 현재 구조(storefront + admin)를 유지하면서, 핵심 기능 10가지(다중 이미지, 고급 옵션, 배송구역, 수동 결제 확인, 주문 추적, 강화된 인증, 리뷰 시스템, 계정 정리, SNS 연동, 법적 페이지)를 추가합니다. 

핵심 상품: 간장게장, 양념게장, 새우장, 연어장, 계란장 + 포케  
언어: 한국어 > 베트남어 > 영어 > 일본어 > 중국어  
토킹톤: 프리미엄 우드톤 기반, 정갈하고 신뢰할 수 있는 D2C  
결제: MVP1은 계좌이체 + QR 안내 + 수동 확인 (실제 연동 금지)  

---

## 2. Current Problems to Fix

1. **상품 이미지**: 단일 이미지만 지원. 다중 이미지, 갤러리, 모바일 탐색 필요
2. **옵션 구조**: 단순 옵션만 지원. 옵션별 추가금, 품절, 필수/선택, min/max 선택 수 미지원
3. **배송**: 배송구역, 배송비, ETA 관리 없음. 전국 배송 가정만 있음
4. **결제**: 실제 결제 연동 없고, 수동 확인 admin 페이지 없음. payment_status vs order_status 미분리
5. **주문 추적**: public tracking page 없음. 주문 완료 후 고객 정보 제공 부족
6. **인증**: mock 수준. production-ready auth UX (email/비밀번호 + SNS 로그인) 필요
7. **리뷰**: 리뷰 시스템 전무
8. **계정**: /account에서 multiplier 노출, 카드 간격 촘촘함
9. **SNS**: footer/floating icons에만 제한적 연동
10. **Footer**: 법적 정보(법인명, MST, 주소, Bộ Công Thương 배지) 부족

---

## 3. Updated Route Tree

### 3.1 Public Routes (추가/변경)

```
/
├── /shop
│   └── /[slug]                    # 상품 상세 (이미지 갤러리 + 리뷰 추가)
├── /collections/[slug]           # 신규: 컬렉션 페이지 (장요리/포케 등)
├── /cart
├── /checkout
├── /order-complete                # 신규: 주문 완료 페이지 (결제 정보 + 추적)
├── /track-order                   # 신규: 주문 추적 페이지
├── /login                         # 강화: SNS 버튼 + guest checkout
├── /register                      # 강화: SNS 버튼, production UX
├── /account
│   ├── /orders
│   │   └── /[id]                  # 주문 상세
│   ├── /addresses                 # 신규: 저장 주소 관리
│   ├── /settings                  # 계정 설정
│   └── /points                    # 포인트 (multiplier 숨김)
├── /faq                          # 신규
├── /delivery                     # 신규
├── /contact                      # 신규
├── /terms
├── /privacy
└── /refund
```

### 3.2 Admin Routes (추가/변경)

```
/admin
├── /login
├── /dashboard
├── /orders
│   ├── /[id]
│   └── (payment_status 분리)
├── /products                      # 강화: 다중 이미지, 고급 옵션
├── /collections                  # 신규
├── /reviews                       # 신규
├── /members
├── /points
├── /hero-banners
├── /bank-accounts
├── /payment-reconciliation        # 신규: 수동 결제 확인
├── /delivery-zones                # 신규: 배송구역/비/ETA
├── /localization                 # 신규: 다국어 관리
├── /notifications
├── /footer                        # 강화: 법적 정보
├── /floating-icons
├── /site-settings
├── /policies                      # 강화: 다국어
├── /faq                          # 신규
├── /contact                      # 신규
└── /media-library                # 신규: 이미지 관리 중앙화
```

---

## 4. Public IA (정보구조)

```
홈(/):
  ├─ 배송 요약 (주소 입력 또는 배송 가능 지역 확인)
  ├─ 히어로 배너
  ├─ 인기상품 (포케/장요리 섹션별)
  ├─ SNS CTA
  └─ Footer (법적 정보 포함)

상점(/shop):
  ├─ 컬렉션 탭 (전체 / 장요리 / 포케)
  ├─ 필터 (가격, 배송 가능)
  └─ 상품 그리드

상품 상세(/shop/[slug]):
  ├─ 이미지 갤러리 (메인 + 썸네일)
  ├─ 상품명, 가격, 설명
  ├─ 옵션 선택 (chip/radio card 우선)
  ├─ 장바구니 추가
  ├─ 리뷰 섹션
  └─ 추천상품

장바구니(/cart):
  ├─ 상품 목록 (옵션 포함 가격)
  ├─ 배송료 계산 (배송구역 기반)
  └─ 체크아웃 버튼

체크아웃(/checkout):
  ├─ 배송지 입력/선택
  ├─ 결제 수단 선택 (계좌이체 / QR)
  ├─ 주문 검토
  └─ 주문 버튼

주문 완료(/order-complete):
  ├─ 주문 확인 메시지
  ├─ 주문번호 / 추적번호 / 총액
  ├─ 계좌이체 정보 또는 QR 표시
  ├─ 추적 버튼
  └─ 고객센터 버튼

주문 추적(/track-order):
  ├─ 주문번호 + 전화번호 입력 또는 추적 토큰
  ├─ 현재 상태 표시
  ├─ 배송 정보
  └─ 고객센터 링크

로그인(/login):
  ├─ 이메일/비밀번호
  ├─ Google / Facebook 버튼
  ├─ 비회원 주문하기
  └─ 비밀번호 찾기

회원가입(/register):
  ├─ 이름, 전화, 이메일, 비밀번호
  ├─ 약관 동의 (필수)
  ├─ 마케팅 동의 (선택)
  └─ 첫 구매 혜택 안내

계정 대시보드(/account):
  ├─ 프로필 (이름, 전화, 이메일, 로그아웃)
  ├─ 최근 주문 (3개 카드)
  ├─ 포인트 (사용 가능 / 적립 예정 / 다음 혜택)
  ├─ 저장 주소 (3개 표시)
  └─ 계정 설정 (비밀번호 변경)

계정 - 주문(/account/orders):
  ├─ 주문 목록 (상태별 탭)
  └─ 주문번호 클릭 > 상세

계정 - 주소(/account/addresses):
  ├─ 저장 주소 목록
  ├─ 추가/편집/삭제
  └─ 기본 주소 설정

계정 - 포인트(/account/points):
  ├─ 포인트 잔액 (사용 가능만 표시)
  ├─ 적립 예정
  ├─ 만료 예정
  └─ 거래 내역

FAQ(/faq):
  ├─ 검색
  └─ Accordion FAQ

배송(/delivery):
  ├─ 배송 가능 지역 지도 또는 텍스트
  ├─ 배송비
  └─ 예상 시간

문의(/contact):
  ├─ 문의 폼 (이름, 이메일, 제목, 메시지)
  └─ 전화/이메일/주소 정보
```

---

## 5. Admin IA (정보구조)

```
대시보드:
  ├─ KPI (신규 / 진행 중 / 완료 / 취소)
  ├─ 어제의 매출
  ├─ 최근 주문 (상태별)
  └─ 미입금 주문 알람

주문 관리:
  ├─ 주문 목록 (order_status 탭: 신규/진행/완료/취소)
  ├─ 주문 상세 (payment_status 표시: 미입금/확인필요/완료)
  ├─ 주문 수정 (배송지, 옵션 등)
  ├─ 캔슬 사유 필수 입력
  └─ 상태 변경

상품 관리:
  ├─ 상품 목록 (컬렉션별 탭)
  ├─ 상품 편집:
  │   ├─ 기본 정보 (이름_ko, 설명_ko, 가격)
  │   ├─ 다중 이미지 (드래그 정렬, 대표 지정, 삭제)
  │   ├─ 옵션 그룹 (단일/다중, 필수/선택, min/max)
  │   │   └─ 옵션값 (이름, price_delta_enabled, price_delta_vnd)
  │   ├─ 식품 정보 (보관, 알러지, 원재료, 무게)
  │   ├─ 배지 (인기, 선물추천 등)
  │   └─ 컬렉션 선택
  └─ 컬렉션 선택

컬렉션 관리:
  ├─ 컬렉션 목록
  ├─ 컬렉션 추가/편집
  │   ├─ 이름 (다국어)
  │   ├─ 설명
  │   ├─ 이미지
  │   └─ 포함 상품 선택
  └─ 정렬

리뷰 관리:
  ├─ 리뷰 목록 (상태별: 대기/승인/숨김/삭제)
  ├─ 리뷰 상세:
  │   ├─ 별점, 텍스트, 사진
  │   ├─ Verified Purchase 배지 자동
  │   └─ 승인/숨김/삭제 버튼
  ├─ 보상 설정 (리뷰 제출 +5점, 사진 +2점)
  └─ 리뷰 포인트 적립 기록

회원 관리:
  ├─ 회원 목록
  ├─ 회원 정보 (포인트, 구매 이력)
  ├─ 포인트 수동 조정
  └─ 회원 상태 변경

포인트 정책:
  ├─ 적립률 설정 (주문 총액의 X%)
  ├─ 최소 주문액
  ├─ 포인트 환산율 (1 포인트 = X VND)
  ├─ 최소 사용 포인트
  ├─ 최대 사용 비율 (주문액의 X%)
  ├─ 유효기간
  ├─ 첫 구매 보너스
  └─ 리뷰 리워드 (+5점 text, +2점 photo)

배송 구역:
  ├─ 배송 구역 목록
  ├─ 구역 추가/편집:
  │   ├─ 구/지역 (다국어)
  │   ├─ 배송 가능 여부
  │   ├─ 배송비
  │   ├─ 예상 시간
  │   ├─ 무료배송 기준 override
  │   ├─ 포케 전용 여부
  │   └─ 장요리 가능 여부
  └─ 정렬

수동 결제 확인:
  ├─ 미입금 주문 목록 (status tab)
  ├─ 항목: 주문번호, 고객명, 결제수단, 예정금액, 입금자명, 참조코드, 입금시간
  ├─ 입금 확인 버튼 (payment_status → 완료)
  ├─ 예정 금액 편집
  └─ 배제(제외) 옵션

배너 관리:
  ├─ 배너 목록
  ├─ 배너 추가/편집 (이미지, 링크, 활성)
  └─ 정렬

은행 계좌:
  ├─ 계좌 목록
  ├─ 계좌 추가/편집 (소유자, 은행, 계좌, 활성)
  ├─ QR 관리 (업로드, 미리보기, 유효기간)
  └─ 결제 안내 text

공지 설정:
  ├─ 공지 템플릿 관리
  ├─ 수신자 선택
  └─ 발송 기록

다국어(Localization):
  ├─ 활성 언어 관리
  ├─ 언어별 키 문자열 관리 (UI 텍스트)
  ├─ 상품 다국어 필드 편집
  └─ 수출/가져오기

Footer:
  ├─ 사이트 정보 (법인명, MST, 주소, 전화, 이메일, 운영시간)
  ├─ Footer 섹션 관리 (고객센터, 약관, SNS 등)
  ├─ 법적 페이지 링크
  └─ 저작권 문구

정책 페이지:
  ├─ 정책 목록 (이용약관, 개인정보처리방침, 환불정책)
  ├─ 정책 편집:
  │   ├─ 제목 (다국어)
  │   ├─ 내용 (HTML 에디터)
  │   └─ 발행일
  └─ 프리뷰

FAQ:
  ├─ FAQ 목록
  ├─ FAQ 추가/편집 (질문_ko, 답변_ko, 카테고리)
  └─ 정렬

문의(Contact):
  ├─ 문의 목록
  ├─ 문의 상세 (고객 정보, 메시지, 답변 상태)
  ├─ 답변 작성
  └─ 상태 변경 (신규/답변/완료)

미디어 라이브러리:
  ├─ 업로드된 이미지 목록
  ├─ 일괄 업로드
  ├─ 정렬/필터
  └─ 삭제
```

---

## 6. Data Model Proposal

### 6.1 Core Types

```typescript
// LocalizedText: 다국어 문자열 구조
interface LocalizedText {
  ko: string
  vi: string
  en: string
  ja: string
  zh: string
}

// 상품 이미지
interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text?: LocalizedText
  is_featured: boolean
  display_order: number
  created_at: string
}

// 옵션 값
interface ProductOptionValue {
  id: string
  option_group_id: string
  name: LocalizedText
  display_order: number
  is_available: boolean
  price_delta_enabled: boolean
  price_delta_vnd: number | null
  image_url?: string // 옵션 전용 이미지
  created_at: string
}

// 옵션 그룹
interface ProductOptionGroup {
  id: string
  product_id: string
  name: LocalizedText
  required: boolean
  single_select: boolean
  min_select: number
  max_select: number
  display_order: number
  option_values: ProductOptionValue[]
  created_at: string
}

// 상품
interface Product {
  id: string
  slug: string
  name: LocalizedText
  description: LocalizedText
  category: 'jarred-seafood' | 'local-poke' | 'gift-set' | 'side'
  collection_ids: string[]
  base_price_vnd: number
  
  // 이미지
  featured_image_id: string // 대표 이미지 ID
  images: ProductImage[]
  
  // 옵션
  option_groups: ProductOptionGroup[]
  
  // 식품 정보
  storage_instructions?: LocalizedText
  allergens?: string[] // ["shrimp", "soy", "gluten"]
  ingredients?: LocalizedText
  weight_g?: number
  shelf_life_days?: number
  food_warnings?: LocalizedText
  
  // 상태
  badges?: Array<'popular' | 'gift-recommended' | 'new' | 'local-only'>
  is_available: boolean
  display_order: number
  
  created_at: string
  updated_at: string
}

// 컬렉션
interface Collection {
  id: string
  slug: string
  name: LocalizedText
  description?: LocalizedText
  image_url?: string
  product_ids: string[]
  display_order: number
  created_at: string
}

// 배송 구역
interface DeliveryZone {
  id: string
  name: LocalizedText // "District 1" / "Binh Thanh" 등
  slug: string
  delivery_fee_vnd: number
  free_delivery_threshold_vnd?: number | null
  estimated_delivery_hours_min: number
  estimated_delivery_hours_max: number
  poke_available: boolean
  jarred_available: boolean
  is_active: boolean
  display_order: number
  created_at: string
}

// 리뷰
interface Review {
  id: string
  product_id: string
  order_id: string
  customer_phone: string
  customer_name: string
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  images: ReviewImage[]
  verified_purchase: boolean
  status: 'pending' | 'approved' | 'hidden' | 'deleted'
  helpful_count: number
  created_at: string
  approved_at?: string
  admin_notes?: string
}

interface ReviewImage {
  id: string
  review_id: string
  url: string
  uploaded_at: string
}

// 주문 라인
interface OrderLineSelectedOption {
  option_group_id: string
  option_value_id: string
  option_name: LocalizedText
  value_name: LocalizedText
  price_delta_vnd: number
}

interface OrderLine {
  id: string
  product_id: string
  product_name: LocalizedText
  base_price_vnd: number
  quantity: number
  selected_options: OrderLineSelectedOption[]
  total_vnd: number // (base_price + option deltas) * quantity
}

// 주소
interface Address {
  id: string
  customer_id?: string
  name: string // "집", "회사" 등
  phone: string
  address: string
  district: string
  notes?: string
  is_default: boolean
  created_at: string
}

// 결제 기록 (reconciliation용)
interface PaymentRecord {
  id: string
  order_id: string
  order_number: string
  customer_name: string
  customer_phone: string
  payment_method: 'bank-transfer' | 'qr-code' | 'cash' // MVP1
  amount_expected_vnd: number
  amount_received_vnd?: number
  payer_name?: string
  reference_code?: string
  payment_status: 'unpaid' | 'needs-verification' | 'completed' | 'excluded'
  paid_at?: string
  verified_at?: string
  verified_by?: string // admin email
  notes?: string
  created_at: string
  updated_at: string
}

// 주문
interface Order {
  id: string
  order_number: string
  tracking_token: string // 고객 추적용 토큰
  
  // 주문 상태 (고객 흐름)
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled'
  
  // 결제 상태 (재무 흐름) - 분리됨
  payment_status: 'unpaid' | 'needs-verification' | 'completed'
  payment_method: 'bank-transfer' | 'qr-code' | 'cash'
  
  // 고객 정보
  buyer: {
    customer_id?: string
    name: string
    phone: string
    email?: string
  }
  
  // 배송 정보
  delivery_zone_id: string
  shipping_address: {
    address: string
    district: string
    notes?: string
  }
  
  // 주문 내용
  order_lines: OrderLine[]
  delivery_fee_vnd: number
  points_used: number
  subtotal_vnd: number
  total_vnd: number
  
  // 특수 요청
  special_requests?: string
  
  // 추적
  estimated_delivery_at?: string
  completed_at?: string
  
  created_at: string
  updated_at: string
}

// 포인트 정책
interface PointsPolicy {
  earn_rate_percent: number // 주문액의 X%
  min_order_to_earn_vnd: number
  points_per_vnd: number // 1포인트 = X VND
  min_points_to_redeem: number
  max_redeem_percent: number // 주문액의 X% 한도
  expiry_months: number
  first_purchase_bonus_points: number
  review_text_bonus_points: number
  review_image_bonus_points: number
  updated_at: string
}

// 포인트 거래
interface PointsLedgerEntry {
  id: string
  customer_id?: string
  customer_phone: string
  type: 'earn' | 'redeem' | 'expire' | 'admin-adjust' | 'review-bonus'
  points_amount: number
  balance_after: number
  description: LocalizedText
  order_id?: string
  review_id?: string
  created_at: string
  admin_notes?: string
}

// 은행 계좌
interface BankAccount {
  id: string
  owner_name: string
  bank_name: string
  account_number: string
  account_holder: string
  is_active: boolean
  qr_code_url?: string
  qr_code_expires_at?: string
  created_at: string
}

// 히어로 배너
interface HeroBanner {
  id: string
  image_url: string
  link_url?: string
  alt_text: LocalizedText
  is_active: boolean
  display_order: number
  created_at: string
}

// SNS 링크
interface SocialLink {
  id: string
  type: 'facebook' | 'instagram' | 'tiktok' | 'threads' | 'youtube'
  label: LocalizedText
  url: string
  is_active: boolean
  display_order: number
}

// Footer 섹션
interface FooterSection {
  id: string
  title: LocalizedText
  links: Array<{
    id: string
    label: LocalizedText
    url: string
    open_in_new_tab: boolean
  }>
  display_order: number
}

// 사이트 설정
interface SiteSettings {
  site_name_ko: string
  tagline_ko: LocalizedText
  logo_url: string
  
  // 법적/사업 정보
  legal_name: string
  mst: string // Vietnam Tax ID
  address: string
  phone: string
  email: string
  operating_hours: LocalizedText
  
  // 배송/결제
  min_order_vnd: number
  free_delivery_threshold_vnd: number | null
  default_delivery_fee_vnd: number
  
  // SNS
  social_links: SocialLink[]
  footer_sections: FooterSection[]
  
  // 법적 페이지
  policies: Array<{ slug: string; title: LocalizedText }>
  
  updated_at: string
}

// 정책 페이지
interface PolicyPage {
  id: string
  slug: string
  title: LocalizedText
  content: string // HTML
  updated_at: string
}

// FAQ
interface FAQItem {
  id: string
  question: LocalizedText
  answer: LocalizedText
  category: string
  is_active: boolean
  helpful_yes_count: number
  helpful_no_count: number
  display_order: number
  created_at: string
}

// 문의 폼
interface ContactSubmission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'replied' | 'closed'
  admin_reply?: string
  replied_at?: string
  replied_by?: string
  created_at: string
}

// 플로팅 아이콘
interface FloatingIcon {
  id: string
  type: 'zalo' | 'phone' | 'kakao' | 'whatsapp' | 'messenger'
  label: LocalizedText
  url: string
  is_active: boolean
  display_order: number
}

// 공지 설정
interface NotificationSetting {
  id: string
  type: 'order-confirmation' | 'order-update' | 'payment-reminder' | 'review-request'
  template: string
  recipients: 'all' | 'verified-only'
  is_active: boolean
  created_at: string
}
```

---

## 7. Page-by-Page Specification

### 7.1 상품 상세 (/shop/[slug])

**목적**: 상품 정보 제공 및 장바구니 추가

**주요 섹션**:
- 이미지 갤러리 (메인 + 썸네일, 모바일 탐색)
- 상품 기본정보 (이름, 가격, 설명)
- 옵션 선택 (칩/라디오 우선, 실시간 가격 업데이트)
- 식품 정보 (보관, 알러지, 원재료, 무게)
- 배지 표시
- 장바구니 추가 버튼
- 리뷰 섹션 (별점, 텍스트, 사진, 최신순/높은평점순)

**컴포넌트**:
- ProductImageGallery (메인 이미지, 썸네일, 모바일 좌우 스와이프)
- ProductOptionSelector (칩/라디오 렌더링, 실시간 가격 계산)
- ReviewSection (리뷰 목록, 리뷰 폼, 별점 분포)

**로컬 상태**:
```typescript
const [selectedOptions, setSelectedOptions] = useState<{[groupId: string]: string | string[]}>({})
const [quantity, setQuantity] = useState(1)
const [currentImageIndex, setCurrentImageIndex] = useState(0)
const [reviewsTab, setReviewsTab] = useState<'recent' | 'highest'>('recent')
const [showReviewForm, setShowReviewForm] = useState(false)
```

**계산**:
```typescript
const optionPriceDelta = selectedOptions 
  ? Object.entries(selectedOptions)
    .reduce((sum, [groupId, valueId]) => {
      const value = getOptionValue(groupId, valueId)
      return sum + (value.price_delta_enabled ? value.price_delta_vnd : 0)
    }, 0)
  : 0
const itemPrice = product.base_price_vnd + optionPriceDelta
const totalPrice = itemPrice * quantity
```

**모바일 규칙**:
- 이미지 갤러리: 터치 스와이프, 전체 화면 모드 버튼
- 옵션: 세로 스택, 선택 시 토스트 피드백
- 리뷰: 사진 터치 → 모달 확대

**Error State**:
- 상품 없음: 404 페이지
- 옵션 품절: 비활성 표시
- 로드 실패: retry 버튼

---

### 7.2 로그인 (/login)

**목적**: 사용자 인증 및 guest checkout 우선 제시

**구성**:
- 이메일/비밀번호 로그인 폼 (이메일, 비밀번호, "로그인" 버튼)
- 또는 SNS (Google, Facebook 버튼)
- "비회원으로 계속 진행" 큰 버튼 (가장 눈에 띄게)
- 비밀번호 찾기 링크

**컴포넌트**:
- LoginForm (이메일, 비밀번호, validation)
- SocialLoginButtons (Google, Facebook)

**로컬 상태**:
```typescript
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)
```

**Interaction Rules**:
- 이메일 validation: 정규식 체크
- 비밀번호: 최소 6자
- SNS 로그인: 팝업 또는 리디렉트 (mock 단계에서도 UX 레이아웃은 정식으로)
- 비회원 버튼: /checkout?guest=true로 리디렉트

**Notes for Cursor/Codex**:
- 실제 auth 연동은 MVP2. 현단계에서는 UX 레이아웃 완성, localStorage mock
- 비회원 플로우: sessionStorage에 guest 플래그만 저장

---

### 7.3 회원가입 (/register)

**목적**: 신규 회원 가입

**구성**:
- 이름 (텍스트)
- 전화번호 (숫자 입력, 포맷팅)
- 이메일 (텍스트, validation)
- 비밀번호 (최소 6자)
- 비밀번호 확인
- [필수] 약관 동의 (체크박스 2개: 이용약관, 개인정보)
- [선택] 마케팅 동의 (체크박스)
- 첫 구매 혜택 안내 (collapsible)
- "가입하기" 버튼
- Google / Facebook 가입 버튼

**컴포넌트**:
- RegistrationForm (필드 + validation)
- AgreementCheckboxes (필수/선택 표시)

**로컬 상태**:
```typescript
const [formData, setFormData] = useState({
  name: '',
  phone: '',
  email: '',
  password: '',
  passwordConfirm: '',
  agreeTerms: false,
  agreePrivacy: false,
  agreeMarketing: false
})
const [errors, setErrors] = useState({})
const [loading, setLoading] = useState(false)
```

**Validation**:
- name: 최소 2자
- phone: 한국 또는 베트남 형식 (정규식)
- email: 유효한 이메일
- password: 최소 6자, 특수문자 권장
- 비밀번호 일치 확인

**Notes for Cursor/Codex**:
- 약관 링크: /terms, /privacy로 이동
- 모든 필드 저장 전 validation
- 가입 성공 → /checkout?registered=true로 리디렉트 또는 /account

---

### 7.4 체크아웃 (/checkout)

**목적**: 주문 최종 확인 및 결제 수단 선택

**구성**:
1. **배송지 입력** (또는 선택, 로그인한 경우)
   - 저장 주소 선택 / 새 주소 입력
   - 동작 확인 후 배송 구역 자동 인식
   - 배송료 계산

2. **주문 검토**
   - 상품 목록 (옵션, 수량, 가격)
   - 배송료
   - 포인트 사용 슬라이더 (로그인한 경우만)
   - 소계 / 총액

3. **결제 수단**
   - 라디오 선택: "계좌이체" / "QR 코드"
   - 각각 선택 시 안내 텍스트 표시

4. **최종 버튼**
   - "주문하기"

**컴포넌트**:
- ShippingSelector
- OrderReview
- PaymentMethodSelector

**로컬 상태**:
```typescript
const [shippingAddress, setShippingAddress] = useState<Address | null>(null)
const [deliveryZone, setDeliveryZone] = useState<DeliveryZone | null>(null)
const [paymentMethod, setPaymentMethod] = useState<'bank-transfer' | 'qr-code'>('bank-transfer')
const [pointsToUse, setPointsToUse] = useState(0)
const [agreeTerms, setAgreeTerms] = useState(false)
const [submitting, setSubmitting] = useState(false)
```

**계산**:
```typescript
const shippingFee = deliveryZone?.delivery_fee_vnd ?? 0
const subtotal = cartTotal
const pointsDiscount = pointsToUse * pointsPolicy.points_per_vnd
const total = subtotal + shippingFee - pointsDiscount
```

**Interaction Rules**:
- 배송지 미입력 → 주문 버튼 비활성
- 약관 미동의 → 주문 버튼 비활성
- 포인트 슬라이더: 0~사용가능포인트, 최대 (주문액×30%)
- 포인트 사용 시 가격 실시간 업데이트

---

### 7.5 주문 완료 (/order-complete)

**목적**: 주문 확인 및 다음 단계 안내

**구성**:
1. **확인 메시지**
   - "주문이 완료되었습니다"
   - 주문번호, 총액, 주문시간

2. **추적 정보**
   - 추적번호 (복사 버튼)
   - "주문 상태 확인" 링크 (/track-order)

3. **결제 안내**
   - 만약 "계좌이체"였다면:
     - 계좌이체 정보 (은행, 계좌, 금액, 참조코드)
     - 입금 기한 (예: 2시간)
   - 만약 "QR"였다면:
     - QR 코드 이미지 (크게)
     - "QR 코드 저장" 버튼

4. **다음 단계**
   - "계속 쇼핑하기" (/shop)
   - "주문 상태 확인" (/track-order)
   - "고객센터" (/contact)

**Notes for Cursor/Codex**:
- URL parameter: ?orderNumber=... &trackingToken=...
- sessionStorage 또는 URL에서 주문 정보 읽기
- 페이지 새로고침 시에도 주문 정보 복구 필요

---

### 7.6 주문 추적 (/track-order)

**목적**: 고객 주문 상태 확인

**구성**:
1. **입력 폼**
   - "주문번호 + 전화번호" 또는 "추적 토큰"
   - 검색 버튼

2. **주문 상태 표시**
   - 진행 상황 타임라인 (pending → preparing → ready → delivering → completed)
   - 현재 단계 강조
   - 배송 예상 시간
   - 배송지 주소
   - 주문 금액

3. **다음 단계 CTA**
   - "고객센터 문의" (/contact)
   - "처음으로" (/)

**Notes for Cursor/Codex**:
- 조회 결과 없음 → "주문을 찾을 수 없습니다" 메시지
- 정보 보안: 전화번호 부분 마스킹 (예: 090-****-5678)

---

### 7.7 계정 대시보드 (/account)

**목적**: 회원 정보 및 주문/포인트 요약 표시

**구성**:
1. **프로필 카드** (gap: 24px mobile, 28px desktop)
   - 이름, 전화, 이메일
   - "정보 수정" 링크
   - "로그아웃" 버튼

2. **최근 주문** (gap: 24px mobile)
   - 3개까지 카드 표시
   - 각 카드: 주문번호, 주문일, 상태, 금액
   - "주문 내역 보기" 링크 (/account/orders)

3. **포인트** (gap: 24px mobile)
   - 사용 가능 포인트 (큰 숫자)
   - 적립 예정 포인트
   - 만료 예정 포인트
   - "포인트 내역" 링크 (/account/points)
   - **주의**: multiplier(1.5x, 2.0x 등) 절대 노출 금지

4. **저장 주소** (gap: 24px mobile)
   - 3개까지 표시
   - 기본 주소 배지
   - "주소 관리" 링크 (/account/addresses)

5. **계정 설정** (gap: 24px mobile)
   - "비밀번호 변경" 링크 (/account/settings)
   - "마케팅 알림 설정" (체크박스)

**스타일 규칙**:
- 모바일: 각 카드/섹션 간 gap 24px (세로 스택)
- 데스크톱: gap 28~32px
- 카드 내부 padding: 16px mobile, 20px desktop
- 카드 배경: #FFFFFF, border: 1px #E8D9C5

**Notes for Cursor/Codex**:
- 로그인하지 않으면 /login으로 리디렉트
- 데이터 로드 중: 스켈레톤 로더
- 모든 카드 간격 CSS 변수화 (--gap-mobile, --gap-desktop)

---

### 7.8 계정 - 주문 내역 (/account/orders)

**목적**: 회원 주문 이력 확인

**구성**:
1. **상태 탭** (pending / confirmed / preparing / completed / cancelled)
2. **주문 목록**
   - 각 항목: 주문번호, 주문일, 상품(1개 표시), 금액, 상태 배지
   - 클릭 → /account/orders/[orderId]로 이동
3. **페이지네이션** (또는 무한 스크롤)
4. **Empty State**: "주문이 없습니다"

**Notes for Cursor/Codex**:
- 로그인 사용자 주문만 필터링
- 상태별 탭 클릭 시 해당 주문만 표시

---

### 7.9 계정 - 포인트 (/account/points)

**목적**: 포인트 잔액 및 거래 내역 표시

**구성**:
1. **포인트 카드** (큰 숫자, 우드톤 배경)
   - "사용 가능 포인트: X,XXX"
   - "적립 예정: X,XXX"
   - "만료 예정: X,XXX"

2. **거래 내역** (테이블 또는 리스트)
   - 날짜, 유형(earn/redeem/expire), 포인트, 잔액, 설명
   - 최신순 정렬
   - 필터: 유형별 탭

3. **규칙 안내**
   - 적립률, 환산율, 유효기간 (정책에서 읽음)

**주의**:
- multiplier 절대 표시 금지 (예: "Gold 1.5x" 금지)
- 고객에게는 "적립 예정" 수량만 보임

**Notes for Cursor/Codex**:
- points_per_vnd 기반으로 포인트 환산 표시
- 테이블 모바일 → 카드 리스트로 변환

---

### 7.10 /admin/products 강화

**목적**: 상품 생성/편집 (다중 이미지, 고급 옵션 포함)

**구성**:
1. **기본 정보**
   - 이름_ko, 설명_ko, 가격_vnd
   - 컬렉션 선택 (체크박스)

2. **다중 이미지**
   - 드래그-앤-드롭 업로드
   - 이미지 목록 (썸네일 + 대표 지정 / 순서 드래그 / 삭제)
   - 이미지 alt 텍스트 입력

3. **옵션 그룹** (추가 버튼)
   각 그룹:
   - 이름_ko (예: "맵기", "포장")
   - 필수/선택 토글
   - 단일/다중 선택 라디오
   - min/max 선택 수 (다중일 때만)
   - 옵션값 목록 (추가 버튼):
     - 각 옵션값: 이름_ko, price_delta_enabled 토글, price_delta_vnd (활성화 시만), 이미지 선택(선택), 품절 토글, 순서 드래그, 삭제

4. **식품 정보**
   - 보관 방법_ko (텍스트)
   - 알러지 (체크박스 리스트)
   - 원재료_ko (텍스트)
   - 무게_g (숫자)
   - 유통기한_days (숫자)
   - 경고_ko (텍스트)

5. **배지** (체크박스)
   - popular, gift-recommended, new, local-only

6. **상태**
   - 활성/비활성 토글
   - 정렬 순서 (숫자)

**컴포넌트**:
- AdminProductForm
- MultiImageUpload (드래그 지원)
- OptionGroupEditor (중첩 옵션값 편집)
- FoodInfoSection

**로컬 상태**:
```typescript
const [product, setProduct] = useState<Product>({...})
const [images, setImages] = useState<ProductImage[]>([])
const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>([])
const [saving, setSaving] = useState(false)
```

**Notes for Cursor/Codex**:
- 옵션값 price_delta_enabled = false면 price_delta_vnd 필드 숨김
- 이미지 업로드: /admin/media-library 또는 직접 업로드 (팝업)
- 저장 전 validation (최소 1개 이미지, 필수 옵션값 선택 여부)

---

### 7.11 /admin/payment-reconciliation

**목적**: 수동 결제 확인 및 payment_status 업데이트

**구성**:
1. **상태 탭** (unpaid / needs-verification / completed)
2. **주문 테이블**
   - 주문번호, 고객명, 결제수단, 예정금액, 입금자명, 참조코드, 입금시간, 상태
   - 클릭 → 상세 모달

3. **상세 모달**
   - 주문 정보 (상품, 주문상태)
   - 결제 정보 (수단, 예정금액, 입금예정시간)
   - 입금 확인 폼:
     - 입금자명 (입력 가능)
     - 실제 입금액 (입력)
     - 참조코드 (입력 가능)
     - 비고 (입력)
     - "입금 확인" 버튼 (payment_status → completed)
   - 또는 "미입금 처리" (payment_status → needs-verification)

4. **필터/정렬**
   - 결제수단 필터
   - 주문번호 검색
   - 날짜 범위

**Notes for Cursor/Codex**:
- payment_status와 order_status는 독립적 (결제 완료 ≠ 주문 배송)
- MegaPay는 disabled "예정" 상태로만 보임 (실제 처리 금지)

---

### 7.12 /admin/delivery-zones

**목적**: 배송 구역 및 배송비 관리

**구성**:
1. **구역 목록** (테이블)
   - 구역명, 배송비, 포케 가능, 장 가능, 활성, 정렬 순서
   - 편집/삭제 버튼

2. **구역 추가/편집 폼**
   - 구역명_ko (예: "District 1")
   - 배송비_vnd
   - 무료배송 기준_vnd (또는 사이트 기본값 사용)
   - 배송 예상 시간 (최소, 최대 시간)
   - 포케 배송 가능 여부 (토글)
   - 장 배송 가능 여부 (토글)
   - 활성 여부 (토글)
   - 정렬 순서 (숫자)

3. **프리뷰**
   - 배송지 입력 시 자동 매칭 로직 안내

**Notes for Cursor/Codex**:
- 배송 구역 미매칭 → 체크아웃에서 오류 메시지 표시
- storefront checkout에서 배송구역 자동 선택

---

### 7.13 /admin/reviews

**목적**: 리뷰 모더레이션

**구성**:
1. **상태 탭** (pending / approved / hidden / deleted)
2. **리뷰 목록** (테이블)
   - 상품명, 고객명, 별점, 텍스트 요약(100자), 사진 여부, Verified Purchase 배지, 상태, 날짜
   - 클릭 → 상세 모달

3. **리뷰 상세 모달**
   - 상품 정보 (이미지, 이름, 링크)
   - 고객 정보 (이름, Verified Purchase 배지)
   - 별점 (큰 별)
   - 텍스트
   - 사진 (갤러리)
   - 좋아요/싫어요 카운트
   - 액션: 승인 / 숨김 / 삭제
   - 관리자 메모 (입력 필드)

4. **보상 설정**
   - 리뷰 제출 기본 보상: +X 포인트
   - 사진 첨부 추가 보상: +X 포인트
   - 저장 버튼

**Rules**:
- Verified Purchase 배지: order_status = completed인 주문과만 연결
- 좋은 리뷰만 보상 금지 → 제출 자체에 보상 구조

**Notes for Cursor/Codex**:
- 리뷰 포인트 적립: admin에서 승인 버튼 클릭 시 자동 생성
- 리뷰 삭제 시: PointsLedgerEntry도 취소 처리

---

### 7.14 Footer & Legal Pages

**footer 구성**:
1. **법인 정보**
   - 법인명, MST, 주소, 전화, 이메일, 운영시간

2. **Bộ Công Thương 배지**
   - 자리 예약 (이미지 링크)

3. **링크 섹션**
   - 고객센터 (FAQ, 배송, 문의)
   - 약관 (이용약관, 개인정보, 환불)
   - 정책 (쿠키, 반품 등)

4. **SNS 링크**
   - Facebook, Instagram, TikTok, Threads

5. **저작권**
   - "(c) 2024 Jin Jang's Kitchen"

**모바일 규칙**:
- 섹션별 accordion 또는 stacked
- 링크 크기: 터치 최소 44px

**법적 페이지** (/terms, /privacy, /refund 등):
- HTML 에디터로 작성
- 다국어 지원 (LocalizedText)
- 버전 관리 (발행일)

---

## 8. Design Tokens

### 색상 (우드톤 기반)
- `--background: #FFFBF5`
- `--foreground: #111827`
- `--card: #FFFFFF`
- `--primary: #8B5E34` (우드 갈색)
- `--primary-foreground: #FFFFFF`
- `--secondary: #E8D9C5` (우드 소프트)
- `--secondary-foreground: #8B5E34`
- `--muted: #F5EDE0`
- `--muted-foreground: #6B7280`
- `--ok: #2E7D32` (완료, 초록)
- `--destructive: #B42318` (취소, 빨강)
- `--border: #E8D9C5`

### 타이포그래피
- **Font**: Noto Sans KR (400, 500, 600, 700)
- **제목**: 600~700 weight, 1.2 line-height
- **본문**: 400 weight, 1.5 line-height
- **설명**: 14px, muted-foreground, 400 weight

### 간격 (CSS 변수화)
```
--gap-mobile: 24px
--gap-desktop: 28px
--gap-large: 32px
--padding-card-mobile: 16px
--padding-card-desktop: 20px
--radius: 0.875rem
```

### 그림자
- `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08)`
- 호버: `0 4px 12px rgba(0, 0, 0, 0.12)`

---

## 9. CMS-to-Storefront Mapping

| Admin 편집 | Storefront 반영 | 즉시 / 캐시 |
|-----------|---------------|-----------|
| Product 정보 (이름, 가격, 이미지, 옵션) | /shop/[slug] 페이지 | 즉시 |
| Collection 생성/편집 | /collections/[slug] 페이지 생성, /shop 탭 업데이트 | 즉시 |
| HeroBanner 활성/정렬 | 홈 배너 회전 | 즉시 |
| DeliveryZone 활성 | /checkout 배송 구역 필터 | 즉시 |
| SiteSettings 업데이트 | Footer, 헤더 텍스트 | 즉시 |
| FooterSection 링크 | Footer 섹션 | 즉시 |
| SNS Link 활성/정렬 | Footer, Floating Icons | 즉시 |
| PolicyPage 발행 | /terms, /privacy, /refund 페이지 | 즉시 |
| FAQItem 추가 | /faq 페이지 업데이트 | 즉시 |
| Review 승인 | /shop/[slug] 리뷰 섹션 | 즉시 |
| PointsPolicy 업데이트 | /account/points 규칙 표시 (multiplier 숨김) | 즉시 |
| FloatingIcon 활성/정렬 | 화면 우측 플로팅 아이콘 | 즉시 |

---

## 10. MVP1 vs MVP2 Scope

### MVP1 (현재 단계)
- 상품 다중 이미지
- 고급 옵션 (가격 델타, 품절)
- 배송 구역 및 배송비
- 수동 결제 확인 (계좌이체 + QR)
- 주문 추적 (토큰 기반)
- Email/비밀번호 + SNS 로그인 UX (실제 연동 X, mock 수준)
- 리뷰 시스템 (텍스트 + 사진)
- 계정 대시보드 정리 (간격 확대)
- SNS 통합 (링크만, 실제 로그인 X)
- Footer 법적 정보
- 다국어 UX (구조만, 일부 텍스트만)

### MVP2 (향후 단계)
- MegaPay 연동 (payment_status 자동)
- 실제 auth 구현 (JWT, 리프레시 토큰)
- 다국어 완성 (모든 필드)
- Tier 시스템 (포인트 multiplier)
- 리뷰 자동 요청 이메일
- 배송 추적 API (택배사 연동)
- 프로모션/쿠폰
- 구독 상품
- SNS 로그인 (실제 연동)
- Analytics 대시보드
- 고객 세분화 / CRM

---

## 11. Login/Register UX Rules

### 공통
- 비회원 버튼은 **가장 눈에 띄게** (큰 크기, 우드톤 배경, 모든 페이지의 우선순위)
- Google / Facebook 버튼은 **선택사항**으로 표시
- 폼 필드: 모바일 너비 100%, 데스크톱 max-width 400px
- validation 메시지: 인라인 (각 필드 아래), 빨강 (#B42318)

### 로그인 페이지
1. 제목: "로그인"
2. 이메일 입력 (placeholder: "이메일 주소")
3. 비밀번호 입력 (show/hide 토글)
4. "로그인" 버튼 (활성화: email + password 입력 시)
5. "비밀번호 찾기" 링크 (placeholder /forgot-password)
6. 또는 SNS 버튼 (Google, Facebook) - 또는 라벨
7. **큰 "비회원으로 계속 진행" 버튼** (우드톤, 모든 것보다 아래)
8. "회원가입" 링크

### 회원가입 페이지
1. 제목: "회원가입"
2. 이름 (placeholder: "이름")
3. 전화 (placeholder: "010-0000-0000", 포맷팅 자동)
4. 이메일 (placeholder: "example@email.com")
5. 비밀번호 (placeholder: "6자 이상", show/hide)
6. 비밀번호 확인 (placeholder: "비밀번호 확인", show/hide)
7. **[필수]** 이용약관 체크박스 (링크: /terms)
8. **[필수]** 개인정보처리방침 체크박스 (링크: /privacy)
9. **[선택]** 마케팅 이메일 수신 체크박스
10. 첫 구매 혜택 안내 (collapsible, 기본 닫힘)
    - 텍스트: "신규 가입 시 X포인트 적립! +"
11. "가입하기" 버튼 (활성화: 모든 필드 + 필수 약관 동의)
12. 또는 SNS 버튼
13. "로그인" 링크

---

## 12. Review + Points Rules

### 리뷰 시스템
1. **작성 자격**: order_status = "completed"인 주문만
2. **표시 조건**: review.status = "approved"만 표시
3. **Verified Purchase 배지**: 자동 (order 연결 확인)
4. **정렬**: 기본 최신순, 사용자 선택 가능 (높은평점순)
5. **사진 표시**: 첨부된 사진 갤러리
6. **좋아요/싫어요**: 고객 피드백 (점수는 아님)
7. **Empty State**: "아직 리뷰가 없습니다"

### 리뷰 보상 (포인트)
1. **리뷰 제출 기본**: admin이 승인 시 +5 포인트
2. **사진 첨부 추가**: +2 포인트
3. **구조**: 리뷰 거부 시 포인트 미적립
4. **금지**: 별점 높을수록 보상 多 구조 금지
5. **기록**: PointsLedgerEntry (type: "review-bonus") 생성

### 포인트 시스템 (MVP1, 고객 보기)
1. **사용 가능 포인트**: 만료되지 않은 포인트 합
2. **적립 예정**: 현재 주문에서 다음 단계 완료 시 적립될 포인트
3. **만료 예정**: 30일 내 만료 예정 포인트
4. **multiplier 절대 숨김**:
   - 고객 화면: "1,500포인트 적립" (1,000원 × 1.5배 결과만 표시)
   - Admin 화면: "1,000원 (Gold 1.5배) = 1,500포인트" (내부용)
5. **사용 규칙**:
   - 최소 사용 포인트: 1,000포인트
   - 최대 사용 비율: 주문액의 30%
   - 환산: 1,000포인트 = X VND (정책에서 설정)

---

## 13. Footer Compliance Notes

### 필수 항목 (Vietnam e-commerce)
1. **법인 정보**
   - 법인명 (또는 개인사업자명)
   - MST (Mã số thuế, Vietnam Tax ID)
   - 사업 주소 (District, City)
   - 전화번호
   - 이메일

2. **Bộ Công Thương 배지**
   - 자리 예약 (이미지 + 링크: https://www.motquangtruong.vn 등)
   - 텍스트: "Đã thông báo với Bộ Công Thương"

3. **정책 링크**
   - 이용약관 (/terms)
   - 개인정보처리방침 (/privacy)
   - 환불 정책 (/refund)
   - 쿠키 정책 (향후)

4. **SNS 링크**
   - Facebook, Instagram, TikTok, Threads

5. **저작권**
   - "(c) 2024 Jin Jang's Kitchen. All rights reserved."

### 모바일
- Footer는 최소 3개 섹션으로 구분
- 각 섹션 제목 클릭 → accordion 열기/닫기
- 링크 최소 44px 터치 영역

---

## 14. Risk Notes

### 기술 위험
1. **다중 이미지 업로드**: 대용량 이미지 처리 → 최적화 필수 (WebP, 압축)
2. **배송 구역 자동 매칭**: 주소 파싱 오류 → 폴백 UI 필요
3. **포인트 적립 로직**: 소수점 처리 → 정수 기반으로 통일
4. **결제 상태 분리**: order_status와 payment_status 동기화 위험 → DB 레벨 constraint 필수

### 운영 위험
1. **리뷰 모더레이션**: 악의적 리뷰 → 자동 필터 + 관리자 승인 필수
2. **배송 구역 관리**: 호치민 구/지역 빈틈 → 최소 1회 감사
3. **수동 결제 확인**: 인력 작업 → 자동화 가능 부분 검토 (MegaPay MVP2)
4. **다국어 관리**: 번역 품질 → 모국어 검수 필수 (베트남어, 일본어, 중국어)
5. **계정 보안**: 비밀번호 길이 검증 X → 최소 8자 권장

### 사업 위험
1. **MegaPay 연동 지연**: MVP2 예정이었으나 고객 요청 시 수동 결제로 운영 가능
2. **배송 비용 구조**: 무료배송 기준 높으면 마진 악화 → 정기 검토 필요
3. **포인트 정책**: 적립률 높으면 재무 부담 → 경쟁사 비교 분석 필수
4. **Tier 시스템 부재 (MVP2)**: 고객 충성도 낮음 → 리뷰/추천으로 보상 강화

---

## Cursor/Codex 구현 체크리스트

- [ ] 모든 Route 파일 생성 (public + admin)
- [ ] 데이터 타입 정의 (LocalizedText 포함)
- [ ] 각 페이지 컴포넌트 구조 (props, state, handlers)
- [ ] 다중 이미지 갤러리 UX
- [ ] 옵션 그룹 & 옵션값 구조 (가격 델타 포함)
- [ ] 배송 구역 자동 매칭 로직
- [ ] 결제 상태 분리 (payment_status vs order_status)
- [ ] 주문 추적 토큰 생성 & 검증
- [ ] 로그인/회원가입 UX (비회원 우선, SNS 버튼)
- [ ] 리뷰 시스템 (작성 + 모더레이션 + 리워드)
- [ ] 계정 대시보드 간격 CSS (24px mobile, 28px desktop)
- [ ] Footer 법적 정보 + Bộ Công Thương 배지
- [ ] 포인트 시스템 (multiplier 숨김, 사용 가능만 표시)
- [ ] Admin 수동 결제 확인 페이지
- [ ] 모든 페이지 모바일 반응형
- [ ] 다국어 구조 (LocalizedText 필드)

---

END OF SPECIFICATION
