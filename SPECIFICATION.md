# Jin Jang's Kitchen — 종합 재설계 명세서 (MVP1)

## 1. 경영진 요약

**프로젝트**: Jin Jang's Kitchen — 프리미엄 한국식 장요리 D2C + 근거리 포케

**현재 상태**: 일반 한식 배달 레스토랑 구조로 구축됨 (재설계 필요)

**재설계 방향**:
- 브랜드: 프리미엄 식품 D2C (선물/가정용 중심)
- 핵심 상품: 간장게장, 양념게장, 새우장, 연어장, 계란장 + 근거리 포케
- 고객: 한국인, 베트남인, 영어 사용자, 일본인, 중국인
- 배송: 호치민 우선 (전국배송 향후 확장)
- 결제: 계좌이체/QR 결제 (MegaPay는 MVP2)

**디자인 톤**: 우드톤 + 아이보리 + 프리미엄 식품 브랜드 신뢰감

---

## 2. 현재 프로젝트에서 바로잡아야 할 문제

### 2.1 상품/카테고리 구조 오류
- **현재**: main/side/soup/beverage/set (일반 레스토랑 메뉴)
- **변경**: 장요리 / 포케 / 세트·선물 / 곁들임

### 2.2 다국어 구조 부재
- **현재**: UI 스위처만 존재, 실제 콘텐츠 다국어화 없음
- **변경**: LocalizedText 타입 전사, 모든 핵심 콘텐츠 다국어화
- **언어 순서**: 한국어 > 베트남어 > 영어 > 일본어 > 중국어

### 2.3 홈페이지가 주문 전환 중심이 아님
- **문제**: 단순 홍보 페이지, 배송 가능 지역/배송비/ETA 정보 없음
- **변경**: 
  - 배송지 확인 UI를 히어로에 통합
  - 배송비/예상시간/가능지역 요약 박스
  - 신뢰 배지 (수제/냉장/호치민배송/계좌이체)

### 2.4 체크아웃이 얕음
- **현재**: 단순 주소/결제 입력만 있음
- **변경**:
  - Guest checkout 우선 + 로그인 고객 저장주소 선택
  - 주문자/수령자 분리
  - payment_status와 order_status 분리
  - 입금용 계좌정보/QR 카드
  - 주문 참조 코드 (결제 추적용)
  - /order-complete 페이지

### 2.5 상품 상세가 D2C 수준이 아님
- **누락**: 보관방법, 알러지, 원재료, 원산지, 중량, 권장섭취기간, 생식주의
- **변경**: 모든 필드를 PDP에 추가, 로컬라이제이션

### 2.6 CMS 구조 부족
- **누락**: 상품 번역관리, 배송구역관리, 히어로 타이틀/CTA, 결제정산관리, footer/FAQ/contact CMS
- **변경**: 18개 메뉴 구조로 확장

### 2.7 페이지 누락
```
필수 추가:
- /account/addresses
- /account/settings  
- /account/orders/[id]
- /track-order
- /order-complete
- /faq
- /delivery
- /contact
- /collections/[slug]
- /terms, /privacy, /refund (pages, not just links)
```

---

## 3. 최종 라우트 트리

### 3.1 공개 사이트 (Storefront)

```
/
  ├─ page.tsx                    # 홈 (전환 중심 재설계)
  ├─ layout.tsx                  # Storefront 공통 레이아웃

/shop
  ├─ page.tsx                    # 메뉴 리스트 (필터/정렬 포함)
  ├─ layout.tsx

/shop/[slug]
  ├─ page.tsx                    # 상품 상세 (D2C 수준)

/collections/[slug]
  ├─ page.tsx                    # 세트/컬렉션 상세

/cart
  ├─ page.tsx                    # 장바구니

/checkout
  ├─ page.tsx                    # 체크아웃 (guest 우선)

/order-complete
  ├─ page.tsx                    # 주문 완료 확인 페이지

/track-order
  ├─ page.tsx                    # 주문 추적 (비로그인 고객도 사용)

/login
  ├─ page.tsx                    # 로그인

/register
  ├─ page.tsx                    # 회원가입

/account
  ├─ page.tsx                    # 계정 대시보드
  ├─ layout.tsx                  # 계정 공통 레이아웃

/account/orders
  ├─ page.tsx                    # 내 주문 목록

/account/orders/[id]
  ├─ page.tsx                    # 주문 상세

/account/addresses
  ├─ page.tsx                    # 저장 주소 관리

/account/settings
  ├─ page.tsx                    # 계정 설정

/account/points
  ├─ page.tsx                    # 포인트 관리

/faq
  ├─ page.tsx                    # FAQ 페이지

/delivery
  ├─ page.tsx                    # 배송 안내

/contact
  ├─ page.tsx                    # 문의하기

/terms
  ├─ page.tsx                    # 이용약관

/privacy
  ├─ page.tsx                    # 개인정보처리방침

/refund
  ├─ page.tsx                    # 환불 정책
```

### 3.2 관리자 (Admin)

```
/admin
  ├─ page.tsx                    # 대시보드

/admin/login
  ├─ page.tsx                    # 관리자 로그인

/admin/orders
  ├─ page.tsx                    # 주문 관리 (payment_status 분리)
  ├─ layout.tsx                  # Admin 공통 레이아웃

/admin/orders/[id]
  ├─ page.tsx                    # 주문 상세 (타임라인형)

/admin/products
  ├─ page.tsx                    # 상품 관리

/admin/collections
  ├─ page.tsx                    # 세트/컬렉션 관리

/admin/hero-banners
  ├─ page.tsx                    # 히어로 배너 관리

/admin/localization
  ├─ page.tsx                    # 다국어 관리

/admin/members
  ├─ page.tsx                    # 회원 관리

/admin/points
  ├─ page.tsx                    # 포인트 정책 관리

/admin/bank-accounts
  ├─ page.tsx                    # 계좌/QR 관리

/admin/payment-reconciliation
  ├─ page.tsx                    # 결제 확인/정산

/admin/delivery-zones
  ├─ page.tsx                    # 배송구역/배송비 관리

/admin/notifications
  ├─ page.tsx                    # 알림 설정

/admin/footer
  ├─ page.tsx                    # 푸터 관리

/admin/floating-icons
  ├─ page.tsx                    # 플로팅 아이콘 관리

/admin/site-settings
  ├─ page.tsx                    # 사이트 설정

/admin/policies
  ├─ page.tsx                    # 정책 관리

/admin/faq
  ├─ page.tsx                    # FAQ 관리

/admin/contact
  ├─ page.tsx                    # 문의 관리

/admin/media-library
  ├─ page.tsx                    # 미디어 라이브러리
```

---

## 4. 공개 사이트 정보구조 (Storefront IA)

### 4.1 홈 (/) — 전환 중심 재설계

**목표**: 배송지 확인 → 신뢰도 구축 → 바로 주문

**섹션 순서**:
1. 헤더 (로고/메뉴/언어/로그인/장바구니)
2. 히어로 섹션
   - 이미지 (모바일/데스크톱 비율 유지, 중앙정렬 정확히)
   - 브랜드명
   - 한 줄 가치 제안
   - CTA 2개 (지금 주문 / 베스트 보기)
   - **배송지 확인 입력 UI** (실제 지도 연결 없이 주소 텍스트 입력만)
   - 신뢰 배지 (수제/냉장/호치민/계좌이체)
3. 배송지 확인 후 요약 박스 (가능지역/배송비/ETA)
4. 카테고리 빠른 진입 (4개 칩)
5. 베스트셀러 섹션 (5~7개 상품 카드)
6. 포케 섹션 (근거리 배송 전용 강조)
7. How It Works (5 스텝)
8. 식품 신뢰 섹션 (보관/알러지/냉장포장/수령후)
9. 테스티모니얼 섹션 (에디토리얼형 후기 카드)
10. FAQ 미리보기 (4~6개 질문)
11. 푸터 (회사정보/연락처/운영시간/정책/SNS)

### 4.2 메뉴 리스트 (/shop)

**원칙**: 5~10개 SKU 기준, 복잡하지 않게

**필수 기능**:
- 카테고리 칩 (4개: 장요리 / 포케 / 세트 / 곁들임)
- 검색
- 정렬 (추천순/최신순/가격순/베스트순)
- 적용된 필터 칩 표시 + clear all
- 카드에 표시:
  - 이미지 / 상품명 / 짧은설명 / 가격
  - 배송범위 배지 (호치민/근거리/전국준비중)
  - 추천 배지 (인기/입문/선물/근거리)

**모바일**: horizontal chip 필터, 무거운 사이드바 금지

### 4.3 상품 상세 (/shop/[slug])

**원칙**: 식품 D2C 수준, 신뢰 중심

**섹션**:
1. 이미지 갤러리
2. 상품명 + 가격
3. 배송범위 배지 + 핵심배지 (냉장/생식주의/입문추천/선물가능)
4. 짧은 소개
5. 구매 박스
   - 수량 (±버튼)
   - 옵션 (포케는 base/protein/topping/sauce 커스터마이징, 장요리는 옵션 거의 없음)
   - 장바구니 / 바로 주문
6. 모바일 sticky add-to-cart bar
7. 상세 설명
8. 보관 방법
9. 권장 섭취 기간
10. 원재료/알러지 정보
11. 중량/용량 / 원산지/구성
12. 맛있게 먹는 법
13. 같이 먹기 좋은 메뉴 추천
14. 추천 상품 섹션
15. FAQ 바로가기

**포케 vs 장요리**: 
- 포케: 커스터마이징 중심, 즉시성 강조
- 장요리: 신뢰/보관/섭취정보 중심

### 4.4 장바구니 (/cart)

**기능**:
- 각 항목별 수량 ±버튼
- 옵션 표시
- 소계 / 배송비 / 총액
- 계속 쇼핑 버튼
- 체크아웃 진행

**비어있을 때**: 계속 쇼핑 유도

### 4.5 체크아웃 (/checkout)

**가장 중요한 변경사항**:

**우선순위**:
1. Guest checkout 가장 눈에 띄게
2. 로그인 고객: 저장 주소 선택 가능

**필수 섹션**:
- 주문 요약 (상품/수량/가격)
- 배송지 정보
  - 기존 주소 선택 (로그인 고객)
  - 새 주소 입력 (모든 고객)
  - 구/지역 선택 (드롭다운)
  - "다른 사람에게 보내기" 체크박스 → 수령자 정보 분리 입력창
- 배송 옵션
  - 예상 배송시간
  - 배송 슬롯 선택 (시간대)
  - 예상 배송비 + 무료배송 기준 안내
- 주문 메모
- 결제 방식 선택
  - QR 결제 (이미지 + 안내)
  - 계좌이체 (계좌명/계좌번호/은행/입금자명 입력)
  - MegaPay (disabled, "예정" 배지)
- **결제 정보 섹션** (MVP1 핵심)
  - "결제 완료 후 아래 계좌로 입금해주세요"
  - 입금용 계좌명 / 계좌번호 / 은행
  - QR 이미지 (선택한 경우)
  - 주문 참조 코드 (복사 버튼 포함)
  - "세금계산서/영수증 요청" (placeholder, later)
- 주문 완료 버튼

**입금자명 필드**: 결제 확인 시 매칭용

### 4.6 주문 완료 (/order-complete)

**표시**:
- 주문번호 (크게)
- "결제 확인 중입니다" 상태 메시지
- 주문 추적 버튼
- 고객센터 버튼
- 주문 참조 코드 재확인 + 복사
- 계좌 정보 재확인
- 계속 쇼핑 버튼

### 4.7 주문 추적 (/track-order)

**비로그인도 사용 가능**:
- 주문번호 + 전화번호 입력
- 또는 추적 토큰 입력
- 주문 상태 타임라인 표시
- 배송 예상시간
- 고객센터 연락처

### 4.8 계정 (/account)

**대시보드**:
- 최근 주문 프리뷰 (3개)
- 포인트 잔액
- 저장 주소 프리뷰
- 기본정보 빠른 수정

### 4.9 주문 목록 (/account/orders)

**표시**:
- 주문번호
- 주문일시
- 상품명 (메인 1개)
- 가격
- 상태 (대기/조리중/배송중/완료/취소)
- 재주문 버튼

### 4.10 주문 상세 (/account/orders/[id])

**타임라인형**:
- 주문정보 (주문번호/일시/가격)
- 배송정보 (주소/예상시간)
- 상품 목록 (수량/옵션/가격)
- 주문 상태 타임라인
  - 주문 완료 ✓ (시간)
  - 결제 완료/대기 ○ (시간 또는 "대기중")
  - 조리 중 ○ (예상 시간)
  - 픽업 예정 ○
  - 배송 중 ○
  - 완료 ○
- 고객센터 버튼

### 4.11 저장 주소 (/account/addresses)

**기능**:
- 저장된 주소 목록
- 주소별 이름 (집/직장/기타)
- 기본 주소 설정
- 추가/수정/삭제
- 최근 주문 주소 "빠른 복사" 버튼

### 4.12 계정 설정 (/account/settings)

**필드**:
- 기본정보 (이름/이메일/전화)
- 비밀번호 변경
- 마케팅 수신 동의
- 계정 탈퇴

### 4.13 포인트 (/account/points)

**표시**:
- 포인트 잔액 (크게)
- 포인트 유효기한
- 포인트 사용 가능 범위
- 포인트 거래 내역 (테이블/타임라인)
  - 거래종류 (적립/사용/만료/조정)
  - 금액
  - 잔액 after
  - 날짜

### 4.14 FAQ (/faq)

**구조**:
- 카테고리 (배송/결제/상품/계정/기타)
- 질문 아코디언
- 검색

### 4.15 배송 안내 (/delivery)

**필수 정보**:
- 배송 범위 (호치민 지도 또는 텍스트)
- 배송비 기준
- 무료배송 기준
- 예상 배송시간
- 배송 불가 지역
- 포케 배송 범위 (근거리만)
- 장요리 배송 범위 (호치민+향후 전국)

### 4.16 문의 (/contact)

**폼**:
- 이름
- 이메일
- 주제 (선택)
- 메시지
- 제출

### 4.17 정책 페이지들 (/terms, /privacy, /refund)

**CMS 연동**:
- HTML 콘텐츠 편집 가능
- 다국어 버전

---

## 5. 관리자 정보구조 (Admin IA)

### 5.1 대시보드 (/admin/dashboard)

**카드**:
- 오늘 주문 수
- 오늘 매출
- 미결제 주문
- 배송 중인 주문

**차트**:
- 주간 매출 추이
- 카테고리별 판매량
- 주문 상태 분포

### 5.2 주문 관리 (/admin/orders)

**테이블 컬럼**:
- 주문번호
- 고객명/전화
- 상품명 (메인 1개)
- 가격
- 주문 상태
- **결제 상태** (미결제/입금완료/확인필요)
- 결제수단
- 주문일시
- 액션 (상세/인쇄/취소)

**필터**:
- 주문 상태 (대기/조리중/배송중/완료/취소)
- 결제 상태 (미결제/입금완료/확인필요)
- 결제수단 (QR/계좌이체/MegaPay)
- 날짜 범위
- 지역

**액션**:
- 주문 상세 클릭
- 상태 변경 (dropdown)
- 결제 확인 처리 (미결제→확인완료)
- Kitchen slip 인쇄 placeholder
- Packing slip 인쇄 placeholder
- 환불 처리 placeholder
- CSV export placeholder

### 5.3 주문 상세 (/admin/orders/[id])

**섹션**:
- 주문정보 (주문번호/일시/채널)
- 고객정보 (이름/전화/이메일)
- 배송정보 (주소/배송비/ETA)
- 상품 목록 (상품명/수량/옵션/가격)
- **결제정보**
  - 결제수단
  - 결제 상태 (dropdown으로 변경 가능)
  - 입금자명 (if 계좌이체)
  - 입금 참조코드
  - 입금액
  - 입금일시 (결제 완료 후)
- 주문상태 타임라인
- 내부 노트 (관리자용, 고객에게 보이지 않음)
- 고객 연락 (전화/문자 shortcut placeholder)

### 5.4 상품 관리 (/admin/products)

**테이블**:
- 이미지
- 상품명 (한국어만 표시, 다국어는 detail로)
- 카테고리
- 가격
- 재고 상태
- 배송범위
- 활성 여부
- 액션

**필터**:
- 카테고리 (장요리/포케/세트/곁들임)
- 활성 여부
- 배송범위

**상품 편집 폼** (create/edit modal 또는 페이지):

**필드**:
- 기본정보
  - Slug (자동 생성 또는 수동)
  - 카테고리 선택
  - 상품 타입 (jang/poke/set/addon)
  - 활성 여부
  - 인기 여부
  - 베스트셀러 여부
  - 선물 가능 여부
  
- 다국어 텍스트 (LocalizedText 구조)
  - 제목 (ko/vi/en/ja/zh)
  - 짧은설명 (ko/vi/en/ja/zh)
  - 긴설명 (ko/vi/en/ja/zh)
  - 보관방법 (ko/vi/en/ja/zh)
  - 권장섭취기간 (ko/vi/en/ja/zh)
  - 먹는법 (ko/vi/en/ja/zh)
  - SEO 제목 (ko/vi/en/ja/zh)
  - SEO 설명 (ko/vi/en/ja/zh)

- 식품 정보
  - 원재료 (ko/vi/en/ja/zh)
  - 알러지 정보 (ko/vi/en/ja/zh)
  - 중량/용량
  - 원산지
  - 생식/해산물 주의문구 (checkbox + localized text)

- 이미지
  - 대표 이미지
  - 갤러리 이미지 (다중)
  - 배송범위별 모바일 이미지 option

- 가격
  - 가격 (VND)
  - 비교가격 (선택)

- 배송
  - 배송범위 (hcm_local/hcm_citywide/nationwide/pickup_disabled)
  - 배송 불가 지역 (텍스트)

- 옵션 (포케 전용)
  - Base options (선택 가능하면 list 입력)
  - Protein options
  - Topping options
  - Sauce options
  - Max selectable

- SEO
  - 정렬 순서

### 5.5 컬렉션/세트 관리 (/admin/collections)

**리스트**:
- 컬렉션명
- 유형 (베스트셀러/입문/선물/가족/포케점심)
- 활성 여부
- 상품 수
- 액션

**컬렉션 편집**:
- 컬렉션명 (한국어, 다국어 필드는 나중)
- 설명
- 대표 이미지
- 포함 상품 선택 (다중)
- 정렬 순서
- 활성 여부

### 5.6 히어로 배너 관리 (/admin/hero-banners)

**테이블**:
- 미리보기 이미지
- 제목 (한국어)
- 활성 여부
- 정렬 순서
- 액션

**배너 편집**:
- 다국어 제목 (LocalizedText)
- 다국어 서브타이틀 (LocalizedText)
- 데스크톱 이미지
- 모바일 이미지 (반응형)
- Focal point X/Y (이미지 cropping 중앙점)
- CTA 1
  - 라벨 (LocalizedText)
  - URL (또는 상품 slug)
- CTA 2
  - 라벨 (LocalizedText)
  - URL
- Overlay opacity
- 활성 여부
- 정렬 순서
- 모바일/데스크톱 미리보기

### 5.7 다국어 관리 (/admin/localization)

**목적**: 전체 번역 완성도 파악 및 누락 항목 식별

**섹션**:
- 언어별 완성도 대시보드
  - 한국어: 100%
  - 베트남어: X%
  - 영어: X%
  - 일본어: X%
  - 중국어: X%

- 누락 항목 표시
  - 상품 다국어 (미작성 상품 수)
  - 배너 다국어 (미작성 배너 수)
  - 정책 다국어 (페이지별)
  - FAQ 다국어
  - UI 문구 다국어

- 일괄 편집 링크 (상품으로 이동, 배너로 이동 등)

### 5.8 회원 관리 (/admin/members)

**테이블**:
- 전화번호
- 이름
- 주문 수
- 총 구매금액
- 포인트 잔액
- 가입일
- 마지막 주문
- 액션

**필터**:
- 가입 날짜
- 총 주문 범위

**회원 상세**:
- 기본정보
- 저장 주소
- 최근 주문 (5개)
- 포인트 잔액
- 관리자 메모
- 계정 차단/활성 toggle

### 5.9 포인트 정책 (/admin/points)

**설정 폼**:
- 적립률 (% of order total)
- 최소 적립 주문금액
- 1 포인트 = X VND
- 최소 사용 포인트
- 최대 사용 비율 (% of order)
- 포인트 유효기간 (개월)
- 티어별 임계값
  - Silver: X VND
  - Gold: X VND
  - VIP: X VND
- 티어별 배수
  - Bronze: 1.0x
  - Silver: 1.2x
  - Gold: 1.5x
  - VIP: 2.0x

**포인트 거래 내역**:
- 회원명
- 거래 종류 (적립/사용/만료/조정)
- 금액
- 잔액 after
- 날짜
- 비고

### 5.10 계좌/QR 관리 (/admin/bank-accounts)

**테이블**:
- 계좌명
- 계좌번호
- 은행
- 활성 여부
- QR 이미지
- 액션

**계좌 편집**:
- 계좌명
- 계좌번호
- 은행 (dropdown)
- 예금주명
- 활성 여부
- QR 이미지 (업로드 또는 생성)

### 5.11 결제 정산 관리 (/admin/payment-reconciliation)

**목표**: 계좌이체/QR 입금을 추적하고 주문 상태 업데이트

**우측 패널** (계좌 잔액 링크, 필터, 엑셀 다운로드 등)

**리스트 뷰**:
- 주문번호
- 고객명
- 결제수단
- 예정 입금액
- 입금자명
- 참조코드
- 상태 (미입금/확인필요/입금완료)
- 입금일시 (입금된 경우)
- 액션

**탭**:
- 미입금 (status=pending)
- 확인필요 (입금은 됐으나 참조코드 미매칭)
- 입금완료 (status=confirmed)

**액션**:
- 상태 수동 변경 (dropdown)
- 입금일시 수동 기록
- 환불 처리 placeholder

### 5.12 배송구역/배송비 관리 (/admin/delivery-zones)

**지역 리스트**:
- 구/지역명 (베트남어)
- 포케 배송 여부
- 장요리 배송 여부
- 배송비
- 무료배송 기준 (VND)
- 예상 배송시간
- 활성 여부
- 액션

**구역 편집**:
- 지역명 (vi/en)
- 포케 배송 가능
- 장요리 배송 가능
- 배송비 (VND)
- 무료배송 기준 override
- 예상 배송시간 (분 또는 시간)
- 배송 불가 메시지 (localized)
- 정렬 순서

### 5.13 알림 설정 (/admin/notifications)

**이메일 템플릿**:
- 주문 완료
- 주문 상태 변경
- 배송 알림
- 포인트 적립
- 마케팅 뉴스레터

**각 템플릿마다**:
- 활성 여부
- 발신자 이메일
- 제목 (localized)
- 본문 (HTML editor)
- 변수 가이드 ({{order_number}}, {{customer_name}} 등)
- 테스트 발송 (이메일 입력)

### 5.14 푸터 관리 (/admin/footer)

**섹션 리스트**:
- 섹션명 (한국어)
- 링크 수
- 액션

**섹션 편집**:
- 섹션명 (localized)
- 링크 (title/url/open in new tab)
- 정렬 순서

**푸터 미리보기**:
- 실시간 렌더링

### 5.15 플로팅 아이콘 관리 (/admin/floating-icons)

**아이콘 리스트**:
- 타입 (Zalo/Phone/Kakao/Custom)
- 라벨 (한국어)
- URL
- 활성 여부
- 액션

**아이콘 편집**:
- 타입 선택 (Zalo/Phone/Kakao/Custom)
- 라벨 (localized)
- URL
- 아이콘 이미지 (선택, Custom인 경우)
- 활성 여부
- 정렬 순서

**모바일 우하단 미리보기**:
- 실시간 렌더링

### 5.16 사이트 설정 (/admin/site-settings)

**기본정보**:
- 사이트명 (localized)
- 태그라인 (localized)
- 로고 이미지

**연락처**:
- 전화
- 이메일
- 주소

**운영**:
- 운영 시간 (텍스트, localized)
- 최소 주문금액
- 기본 배송비
- 무료배송 기준

**소셜**:
- Facebook URL
- Instagram URL
- Zalo URL

**알리미**:
- 운영자 이메일 (주문/문의 알림 수신)

### 5.17 정책 관리 (/admin/policies)

**페이지 리스트**:
- 이용약관
- 개인정보처리방침
- 환불 정책
- 배송 안내 (선택)

**페이지 편집**:
- 제목 (localized)
- 본문 (HTML editor, localized)
- 마지막 수정일시

### 5.18 FAQ 관리 (/admin/faq)

**FAQ 리스트**:
- 카테고리 (배송/결제/상품/계정/기타)
- 질문 (한국어)
- 활성 여부
- 정렬 순서
- 액션

**FAQ 편집**:
- 카테고리
- 질문 (localized)
- 답변 (HTML editor, localized)
- 활성 여부
- 정렬 순서

### 5.19 문의 관리 (/admin/contact)

**문의 리스트**:
- 이름
- 이메일
- 주제
- 상태 (신규/답변중/완료)
- 작성일
- 액션

**문의 상세**:
- 내용
- 답변 입력창
- 상태 변경

### 5.20 미디어 라이브러리 (/admin/media-library)

**기능**:
- 이미지 업로드
- 그리드 뷰
- 다운로드/삭제
- 검색 (파일명)

---

## 6. 데이터 모델 제안

### 6.1 LocalizedText (모든 텍스트 필드 기본)

```typescript
type LocalizedText = {
  ko: string
  vi: string
  en: string
  ja: string
  zh: string
}
```

### 6.2 Product

```typescript
interface Product {
  // 기본
  id: string
  slug: string
  createdAt: Date
  updatedAt: Date
  
  // 분류
  category: 'jang' | 'poke' | 'set' | 'addon'
  isActive: boolean
  isFeatured: boolean
  isBestSeller: boolean
  isGiftable: boolean
  sortOrder: number
  
  // 텍스트 (다국어)
  title: LocalizedText
  shortDescription: LocalizedText
  longDescription: LocalizedText
  storageInstruction: LocalizedText
  servingSuggestion: LocalizedText
  seoTitle: LocalizedText
  seoDescription: LocalizedText
  
  // 이미지
  primaryImage: string        // URL
  galleryImages: string[]     // URLs
  mobileImage?: string
  
  // 식품 정보
  allergenInfo: LocalizedText
  ingredients: LocalizedText
  countryOfOrigin: string     // localized name in LocalizedText
  weightOrVolume: string
  shelfLifeText: LocalizedText
  hasRawSeafoodWarning: boolean
  rawSeafoodWarning?: LocalizedText
  
  // 가격
  price: number               // VND
  compareAtPrice?: number     // VND
  
  // 배송
  deliveryScope: 'hcm_local' | 'hcm_citywide' | 'nationwide' | 'pickup_disabled'
  
  // 포케 옵션 (category === 'poke' 일때만)
  pokeOptions?: {
    bases: string[]
    proteins: string[]
    toppings: string[]
    sauces: string[]
    maxSelectable: number
  }
}
```

### 6.3 Collection (세트/컬렉션)

```typescript
interface Collection {
  id: string
  slug: string
  
  // 다국어
  title: LocalizedText
  description: LocalizedText
  
  // 이미지
  image: string
  
  // 상품 매핑
  productIds: string[]
  
  // 설정
  collectionType: 'bestseller' | 'intro' | 'gift' | 'family' | 'poke_lunch'
  isActive: boolean
  sortOrder: number
}
```

### 6.4 HeroBanner

```typescript
interface HeroBanner {
  id: string
  
  // 이미지
  desktopImage: string
  mobileImage: string
  
  // 다국어
  title: LocalizedText
  subtitle: LocalizedText
  
  // CTA
  cta1: {
    label: LocalizedText
    href: string  // 상품 slug 또는 URL
  }
  cta2?: {
    label: LocalizedText
    href: string
  }
  
  // 스타일
  overlayOpacity: number  // 0-1
  focalPointX: number     // 0-100 (%)
  focalPointY: number     // 0-100 (%)
  
  // 설정
  isActive: boolean
  sortOrder: number
}
```

### 6.5 Order

```typescript
interface Order {
  id: string
  orderNumber: string  // display용, 예: ORD-20260307-001
  
  // 타이밍
  createdAt: Date
  updatedAt: Date
  
  // 주문자 정보
  buyerName: string
  buyerEmail?: string
  buyerPhone: string
  
  // 수령자 정보 (분리)
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  recipientDistrict: string
  
  // 상품
  lines: OrderLine[]
  
  // 배송
  estimatedDeliveryTime: string  // "오후 2~3시" 형식
  deliveryFee: number            // VND
  
  // 가격
  subtotal: number               // VND
  total: number                  // VND, delivery fee 포함
  
  // 상태 분리 (중요!)
  orderStatus: 'pending' | 'preparing' | 'ready' | 'shipping' | 'completed' | 'cancelled'
  paymentStatus: 'unpaid' | 'confirming' | 'confirmed' | 'refunded'
  
  // 결제
  paymentMethod: 'qr' | 'bank_transfer' | 'megapay'
  paymentReferenceCode: string  // 추적용
  refundReferenceCode?: string
  
  // 입금자명 (bank_transfer 일때)
  depositorName?: string
  
  // 수동 기록 필드
  confirmedAt?: Date
  confirmedBy?: string          // admin user id
  refundedAt?: Date
  refundedBy?: string
  
  // 메모
  customerNote?: string
  internalNote?: string        // 관리자만 볼 수 있음
  cancellationReason?: string
  
  // 포인트
  pointsUsed?: number
  pointsEarned?: number
}

interface OrderLine {
  id: string
  productId: string
  productTitle: LocalizedText  // snapshot
  quantity: number
  price: number                 // unit price, VND
  selectedOptions?: {
    groupId: string
    groupName: string
    optionId: string
    optionName: string
    priceDelta: number
  }[]
  total: number                 // price * quantity + options, VND
}
```

### 6.6 Address (저장 주소)

```typescript
interface Address {
  id: string
  userId: string
  
  label: string              // "집", "직장", "기타"
  fullAddress: string
  district: string           // "Quận 1"
  phone: string
  recipientName: string
  
  isDefault: boolean
  
  createdAt: Date
  updatedAt: Date
}
```

### 6.7 DeliveryZone (배송구역)

```typescript
interface DeliveryZone {
  id: string
  
  // 지역
  districtName: string       // "Quận 1" (localized)
  districtNameVi: string
  
  // 포케/장요리 배송 범위
  pokeDeliverable: boolean
  jangDeliverable: boolean
  
  // 비용
  deliveryFee: number        // VND
  freeDeliveryThreshold?: number  // VND, override 가능
  
  // 시간
  estimatedMinutes: number
  
  // 설정
  isActive: boolean
  sortOrder: number
}
```

### 6.8 BankAccount

```typescript
interface BankAccount {
  id: string
  
  accountName: string
  accountNumber: string
  bankName: string
  depositorName: string
  
  qrImage?: string            // URL
  qrImageUploadedAt?: Date
  
  isActive: boolean
  sortOrder: number
}
```

### 6.9 PointsPolicy

```typescript
interface PointsPolicy {
  earnRatePercent: number       // 1 = 1% of order
  minOrderToEarn: number        // VND
  pointsPerVnd: number          // 1 point = X VND
  minPointsToRedeem: number
  maxRedeemPercent: number      // max % of order paid with points
  expiryMonths: number
  
  tierThresholds: {
    silver: number              // VND
    gold: number
    vip: number
  }
  
  tierMultipliers: {
    bronze: number
    silver: number
    gold: number
    vip: number
  }
}
```

### 6.10 PointsLedger

```typescript
interface PointsLedger {
  id: string
  memberId: string
  
  type: 'earn' | 'redeem' | 'expire' | 'adjust'
  amount: number
  balanceAfter: number
  
  description: string
  orderId?: string
  
  createdAt: Date
  createdBy: string            // admin user id
}
```

### 6.11 Member

```typescript
interface Member {
  id: string
  phone: string                // unique
  name: string
  email?: string
  
  // 포인트
  pointsBalance: number
  tier: 'bronze' | 'silver' | 'gold' | 'vip'
  
  // 통계
  totalOrders: number
  totalSpent: number           // VND
  
  // 마케팅
  marketingOptIn: boolean
  
  // 상태
  isActive: boolean
  isBlocked: boolean
  
  // 메모
  adminNote?: string
  
  createdAt: Date
  lastOrderAt?: Date
}
```

### 6.12 SiteSettings

```typescript
interface SiteSettings {
  // 브랜드
  siteName: LocalizedText
  tagline: LocalizedText
  logoUrl: string
  
  // 연락처
  phone: string
  email: string
  address: string
  
  // 운영
  operatingHours: LocalizedText
  minOrderAmount: number        // VND
  defaultDeliveryFee: number
  freeDeliveryThreshold: number
  
  // 소셜
  socialLinks: {
    facebook?: string
    instagram?: string
    zalo?: string
  }
}
```

### 6.13 FAQItem

```typescript
interface FAQItem {
  id: string
  
  category: 'delivery' | 'payment' | 'product' | 'account' | 'other'
  
  question: LocalizedText
  answer: LocalizedText        // HTML
  
  isActive: boolean
  sortOrder: number
}
```

### 6.14 PolicyPage

```typescript
interface PolicyPage {
  id: string
  slug: string                 // 'terms' | 'privacy' | 'refund'
  
  title: LocalizedText
  content: LocalizedText       // HTML
  
  updatedAt: Date
}
```

---

## 7. 페이지별 상세 설계

### 7.1 / (홈) — 전환 중심 재설계

**경로**: `app/(storefront)/page.tsx`

**목적**: 배송 가능성 확인 → 신뢰 구축 → 주문 전환

**구성 요소**:
1. Header (기존 유지, 언어 스위처 포함)
2. HeroSection
   - 이미지 (데스크톱/모바일 다른 비율, 중앙정렬)
   - 브랜드명 + 한 줄 가치 제안
   - CTA 2개
   - 배송지 확인 입력 UI
   - 신뢰 배지 4개
3. DeliveryCheckResult (배송지 입력 후만 표시)
   - 가능 지역 / 배송비 / 예상 ETA
4. CategoryQuickAccess (4개 칩)
5. BestsellerSection (5~7개)
6. PokeSection (3~4개)
7. HowItWorks (5 스텝)
8. TrustSection (보관/알러지/냉장)
9. TestimonialSection (카드형)
10. FAQPreview (4~6개)
11. Footer

**상태**:
- `currentLanguage: string` (from context)
- `deliveryDistrict: string | null`
- `isDeliveryCheckValid: boolean`
- `deliveryInfo: { fee, eta, scope } | null`

**데이터 요청**:
- Banners (isActive=true, sorted)
- Products (isFeatured=true, limit 7)
- FAQItems (active, limit 6)
- SiteSettings
- DeliveryZones (all)

**상호작용**:
- 배송지 입력 → DeliveryZone 검색 → 결과 표시
- "지금 주문" 클릭 → /shop로 이동
- "베스트 보기" 클릭 → /shop으로 이동
- 카테고리 칩 클릭 → /shop?category=X

**모바일**:
- 히어로 비율: 16:9
- 배송지 입력: 전폭 input
- 신뢰 배지: 2×2 그리드
- 섹션 간 padding 줄임

---

### 7.2 /shop (메뉴 리스트)

**경로**: `app/(storefront)/shop/page.tsx`

**목적**: 상품 발견 및 필터링

**구성**:
1. 필터바 (horizontal chips on mobile)
   - 카테고리 (4개)
   - 정렬 (dropdown)
2. 적용 필터 표시 + clear all
3. 상품 그리드 (2열 mobile, 3열 tablet, 4열 desktop)
4. 상품 카드
   - 이미지 + 로딩스켈톤
   - 상품명
   - 짧은설명 (2줄 truncate)
   - 가격
   - 배지 (배송범위 + 추천)

**쿼리 파라미터**:
- `category`: jang|poke|set|addon
- `sort`: recommended|newest|price_asc|price_desc|bestseller
- `search`: string

**상태**:
- `selectedCategory: string`
- `sortBy: string`
- `searchQuery: string`
- `filteredProducts: Product[]`

**데이터**:
- Products (필터링 후)

**상호작용**:
- 카테고리 칩 클릭 → URL 업데이트 → 상품 필터링
- 정렬 변경 → URL 업데이트
- 검색 입력 → debounce → 필터링
- 상품 카드 클릭 → /shop/[slug]로 이동

---

### 7.3 /shop/[slug] (상품 상세)

**경로**: `app/(storefront)/shop/[slug]/page.tsx`

**목적**: 상세 정보 제공 + 구매 결정 최적화

**섹션** (순서대로):
1. 이미지 갤러리 (좌측, desktop) 또는 슬라이더 (mobile)
2. 우측 정보 영역 (desktop) / 하단 영역 (mobile)
   - 상품명
   - 가격
   - 배지 (배송범위 + 신뢰 배지)
   - 짧은설명
   - 구매 박스
     - 수량 (±버튼)
     - 옵션 (포케는 base/protein/topping/sauce, 장요리는 제한적)
     - 장바구니 버튼
     - 바로 주문 버튼
3. 모바일 sticky bar (add-to-cart 영역)
4. 상세 설명 (HTML)
5. 식품 정보 섹션
   - 보관 방법
   - 권장 섭취 기간
   - 원재료 / 알러지
   - 중량 / 원산지
   - 맛있게 먹는 법
6. 함께 먹기 좋은 메뉴 (섹션/관련 상품)
7. 추천 상품 (비슷한 카테고리, 3~4개)
8. FAQ 바로가기 (상품 관련 질문 3개)

**상태**:
- `quantity: number`
- `selectedOptions: { groupId: string, optionId: string }[]`
- `isAddingToCart: boolean`
- `addedToCartSuccess: boolean`

**데이터**:
- Product (by slug)
- RelatedProducts (같은 카테고리)
- FAQItems (상품 관련)

**상호작용**:
- 수량 ±클릭 → quantity 업데이트
- 옵션 선택 → selectedOptions 업데이트
- "장바구니" 클릭 → CartContext 업데이트 → toast
- "바로 주문" 클릭 → CartContext 업데이트 → /checkout로 이동
- 이미지 클릭 → 모달 확대

---

### 7.4 /checkout (체크아웃) — MVP1 핵심

**경로**: `app/(storefront)/checkout/page.tsx`

**목적**: 비로그인 우선 + 계좌이체/QR 결제 정산 운영

**레이아웃**: 2열 (데스크톱), 1열 (모바일)
- 좌측: 주문 요약
- 우측: 입력 폼

**우측 폼 섹션**:

1. **고객정보**
   - 고객명 (required)
   - 이메일 (optional)
   - 전화번호 (required)
   - "비회원으로 계속" vs "로그인" toggle

2. **배송 주소**
   - 로그인 고객: 저장 주소 선택 + "새 주소 추가"
   - 모든 고객: 주소 입력폼
     - 전폭 주소 입력
     - 구 선택 (dropdown)
   - "다른 사람에게 보내기" checkbox
     - 체크시: 수령자명 / 수령자 전화 필드 표시

3. **배송 옵션**
   - 배송 슬롯 선택 (시간대 버튼)
   - 예상 배송비 표시 + "무료배송 기준" 링크
   - 주문 메모 textarea (선택)

4. **결제 방식 선택**
   - QR 결제 (라디오)
   - 계좌이체 (라디오)
   - MegaPay (disabled, "MVP2" 배지)

5. **결제 정보** (중요!)
   - 선택한 방식에 따라 동적 렌더링
   - **QR 선택시**:
     - "선택된 계좌로 아래 QR을 스캔해 입금해주세요"
     - QR 이미지 (크게)
     - 계좌명 / 계좌번호 / 은행
   - **계좌이체 선택시**:
     - "아래 계좌로 입금해주세요"
     - 입금자명 입력 필드 (required, 결제 매칭용)
     - 입금용 계좌정보 카드
       - 계좌명
       - 계좌번호
       - 은행
     - 참조코드 (자동 생성, 복사 버튼)
     - QR 이미지

6. **주문 완료 버튼**

**주문 요약 (좌측, sticky)**:
- 상품 목록 (이미지 thumbnail + 상품명 + 수량 + 가격)
- 소계
- 배송비
- 총액 (강조)
- "주문 수정" 링크 (장바구니로)

**유효성**:
- 필수 필드 표시 (*)
- 제출 시 검증
- 에러 메시지 inline

**제출 후**:
- /order-complete로 이동
- 주문번호 / 참조코드 / 결제안내 표시

---

### 7.5 /order-complete (주문 완료)

**경로**: `app/(storefront)/order-complete`

**목적**: 주문 확인 및 다음 스텝 안내

**표시**:
- 주문번호 (크게, 복사 버튼)
- "결제 확인 중입니다" 상태 메시지 (정보성)
- 주문 요약 (상품/배송지/배송비/총액)
- **결제 정보 섹션** (다시 한번 표시)
  - 입금할 계좌
  - 입금자명
  - 참조코드 (복사 버튼)
  - 또는 QR 이미지
- CTA 버튼 2개
  - "주문 추적" (→ /track-order)
  - "계속 쇼핑" (→ /shop)
- 고객센터 연락처

**상태**: 
- order 객체 (URL param 또는 context에서)

---

### 7.6 /track-order (주문 추적)

**경로**: `app/(storefront)/track-order`

**목적**: 비로그인 고객도 주문 상태 추적

**폼**:
- 주문번호 입력
- 전화번호 입력
- 또는 "추적 토큰" 입력 (시간 제한이 있는 토큰)
- "조회" 버튼

**조회 결과**:
- 주문 기본정보
- 상태 타임라인
  - 주문 완료 ✓
  - 결제 대기/완료 ○
  - 조리 중 ○
  - 픽업 예정 ○
  - 배송 중 ○
  - 완료 ○
- 배송지 / 배송비 / 총액
- 고객센터 버튼

---

### 7.7 /account (계정 대시보드)

**경로**: `app/(storefront)/account/page.tsx`

**목적**: 회원정보 한눈에 보기

**레이아웃**: 메인 콘텐츠 + 좌측 네비게이션 (mobile: horizontal tabs)

**섹션**:
1. 프로필 카드
   - 이름
   - 전화
   - 가입일
   - 편집 버튼

2. 포인트 요약
   - 잔액 (크게)
   - 유효기한
   - "포인트 관리" 링크

3. 최근 주문 (3개)
   - 주문번호 / 주문일 / 상태 / 가격
   - 각 주문별 "상세" 링크

4. 저장 주소 프리뷰 (2개)
   - 주소 label + 주소 요약
   - "모두 보기" 링크

5. 계정 설정 진입
   - 비밀번호 변경
   - 마케팅 수신 동의
   - 계정 탈퇴

---

### 7.8 /account/orders (주문 목록)

**경로**: `app/(storefront)/account/orders/page.tsx`

**목적**: 내 모든 주문 조회

**테이블/리스트**:
- 주문번호
- 주문일시
- 상품명 (메인 1개)
- 가격
- 상태 (badge)
- 액션 ("상세" 링크)

**필터**:
- 상태 (all/pending/completed/cancelled)
- 날짜 범위 (optional)

**정렬**: 최신순 (default)

**빈 상태**: "주문 이력이 없습니다"

---

### 7.9 /account/orders/[id] (주문 상세)

**경로**: `app/(storefront)/account/orders/[id]/page.tsx`

**목적**: 주문 전체 정보 조회 + 재주문

**섹션**:
1. 주문 기본정보
   - 주문번호 / 주문일시 / 상태

2. 상품 목록
   - 각 항목: 이미지 + 상품명 + 수량 + 옵션 + 가격
   - 소계 / 배송비 / 총액

3. 배송 정보
   - 배송지 주소
   - 배송 예상시간
   - 배송 상태 타임라인

4. 결제 정보
   - 결제수단
   - 결제 상태
   - 입금자명 (if 계좌이체)

5. 재주문 버튼
   - 클릭 → 장바구니에 추가 → /cart로 이동

---

### 7.10 /account/addresses (저장 주소 관리)

**경로**: `app/(storefront)/account/addresses/page.tsx`

**목적**: 주소 저장 및 관리

**리스트**:
- 각 주소별 카드
  - Label (집/직장)
  - 전폭 주소
  - 기본 주소 badge
  - 액션 (수정/삭제)

**"새 주소 추가" 버튼**:
- Modal 또는 form 페이지로

**수정/추가 폼**:
- Label 선택 (집/직장/기타)
- 수령자명
- 전화번호
- 전폭 주소
- 구 선택
- 기본 주소 toggle
- 저장 버튼

**빈 상태**: "저장된 주소가 없습니다"

---

## 8. 디자인 토큰

### 8.1 색상

```
Primary (Wood):
  - dark: #8B5E34
  - light: #E8D9C5
  
Neutral:
  - background: #FFFBF5
  - surface: #FFFFFF
  - text: #111827
  - text-muted: #6B7280
  - border: #E5E7EB
  - border-light: #F5EDE0
  
Status:
  - success: #2E7D32
  - danger: #B42318
  - warning: #F59E0B
  - info: #3B82F6
```

### 8.2 타이포그래피

```
Font Family:
  - 한국어: Noto Sans KR, system fonts
  - 영문: system fonts (Segoe UI, -apple-system)

Sizes:
  - h1: 28px (mobile) / 36px (desktop)
  - h2: 24px (mobile) / 28px (desktop)
  - h3: 20px / 24px
  - h4: 16px / 20px
  - body: 14px / 16px
  - small: 12px / 14px
  - caption: 11px / 12px

Line Height:
  - heading: 1.2
  - body: 1.6
  - compact: 1.4
```

### 8.3 간격

```
Scale: 4px base unit
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- 3xl: 48px
```

### 8.4 모서리

```
- sm: 4px
- md: 8px
- lg: 12px
- xl: 16px
- full: 9999px (pill shape)
```

### 8.5 그림자

```
- sm: 0 1px 2px rgba(0,0,0,0.05)
- md: 0 4px 6px rgba(0,0,0,0.1)
- lg: 0 10px 15px rgba(0,0,0,0.15)
```

---

## 9. CMS-to-Storefront 데이터 매핑

| Admin CMS 페이지 | Admin 편집 항목 | Storefront 반영 위치 | 데이터 필드 |
|---|---|---|---|
| /admin/site-settings | 사이트명 | /`siteName` 헤더에 | SiteSettings.siteName |
| /admin/site-settings | 운영시간 | / 푸터 | SiteSettings.operatingHours |
| /admin/hero-banners | 배너 생성/편집 | / 히어로 섹션 | HeroBanner[] (isActive=true) |
| /admin/hero-banners | 배너 이미지/제목 | / 히어로 (모바일/데스크톱 분리) | HeroBanner.{desktopImage, mobileImage, title} |
| /admin/products | 상품 생성/편집 | /shop 리스트 + /shop/[slug] 상세 | Product.{title, image, price, category} |
| /admin/products | 상품 다국어 | /shop, /shop/[slug] (언어에 따라) | Product.title/description (LocalizedText) |
| /admin/products | 배송범위 설정 | /shop 카드 배지, /shop/[slug] 배지 | Product.deliveryScope |
| /admin/collections | 세트 생성 | /collections/[slug] 페이지 | Collection.productIds 매핑 |
| /admin/delivery-zones | 배송비/ETA 설정 | / 배송지 확인 결과 + /checkout | DeliveryZone.{deliveryFee, estimatedMinutes} |
| /admin/notifications | 이메일 템플릿 설정 | 주문 후 이메일 발송 | 주문 상태별 template lookup |
| /admin/footer | 푸터 링크 설정 | / 푸터 렌더링 | SiteSettings.footerSections |
| /admin/floating-icons | 아이콘 설정 | 모바일 우하단 아이콘 | FloatingIcon[] (isActive=true) |
| /admin/faq | FAQ 생성/편집 | /faq 페이지 + / 미리보기 | FAQItem[] (isActive=true) |
| /admin/policies | 정책 페이지 편집 | /terms, /privacy, /refund | PolicyPage.content (HTML) |
| /admin/members | 회원 관리 | /account/orders 등에서 조회 | Member (로그인 후) |
| /admin/points | 포인트 정책 설정 | /account/points 표시 | PointsPolicy 전역 setting |
| /admin/bank-accounts | 계좌/QR 설정 | /checkout 결제정보, /order-complete | BankAccount[] (isActive=true) |

---

## 10. MVP1 vs MVP2 범위

### MVP1 (현재 단계)
- ✅ 계좌이체 + QR 결제 (수동 입금 확인)
- ✅ Guest checkout + 회원가입
- ✅ 주문 추적 (비로그인)
- ✅ 포인트 시스템 (구조만, 기능은 나중)
- ✅ 다국어 구조 (한국어만 콘텐츠, 다른 언어는 structure 준비)
- ✅ 배송구역/배송비 관리
- ✅ 모든 CMS 구조

### MVP2 (향후 단계)
- ⏳ MegaPay 결제 게이트웨이
- ⏳ 포인트 적립/사용 실제 기능
- ⏳ 구독 배송
- ⏳ 추천 알고리즘
- ⏳ 리뷰 시스템
- ⏳ 리퍼럴 프로그램
- ⏳ 앱 전용 기능

---

## 11. 카피 노트

### 11.1 핵심 메시지

**홈 히어로**:
```
제목: "Jin Jang's Kitchen"
서브: "프리미엄 한국식 장요리, 호치민에서"
CTA1: "지금 주문하기"
CTA2: "베스트 메뉴 보기"
```

**신뢰 배지**:
- "손으로 만든 수제"
- "냉장 포장 배송"
- "호치민 당일 배송"
- "안전한 계좌이체/QR 결제"

**배송 확인**:
```
"어디로 배달해드릴까요?"
→ 입력 후
"배송 가능합니다 | 배송비 25,000₫ | 예상 2시간"
```

### 11.2 페이지별 CTA

| 페이지 | CTA 텍스트 |
|---|---|
| / | "지금 주문" / "베스트 보기" |
| /shop | "상세보기" |
| /shop/[slug] | "장바구니 담기" / "바로 주문" |
| /checkout | "주문 완료" |
| /account | "주문 관리" / "포인트 확인" |

---

## 12. 리스크 노트

### 12.1 기술 리스크

**결제 정산 운영의 어려움**:
- 문제: 계좌이체 입금자명과 주문 참조코드 매칭이 수동
- 해결: Admin의 payment-reconciliation 페이지에서 반자동 매칭 UI
- 향후: MegaPay 연동으로 자동화

**배송 범위 데이터 관리**:
- 문제: 베트남의 번외지 분류 불명확
- 해결: 배송 구역 DB에서 실제 테스트 필요, admin에서 쉽게 수정 가능하게 설계

**다국어 콘텐츠 완성도**:
- 문제: 초기엔 한국어만 있고 다국어는 비어있을 수 있음
- 해결: Localization admin 페이지에서 누락 항목 식별, 점진적 작성
- UI는 다국어 스위처가 있지만, 콘텐츠가 없으면 한국어로 fallback

### 12.2 운영 리스크

**포인트 시스템 복잡성**:
- MVP1에서는 포인트 구조만 만들고 기능은 disabled 권장
- MVP2에서 활성화

**세트/컬렉션 관리**:
- 초기엔 4~5개 정도만 만들고, 시간에 따라 확장
- CMS에서 쉽게 추가/삭제 가능하게 설계

**이미지 최적화**:
- 모바일/데스크톱 별도 이미지 필요 (히어로, 배너)
- CDN 또는 이미지 최적화 서비스 연동 필수

### 12.3 비즈니스 리스크

**포케 vs 장요리 배송 범위 혼동**:
- 체크아웃에서 배송 가능 여부를 명확히 표시
- 포케는 "근거리 배송만 가능합니다" 명시

**배송 ETA 현실성**:
- "예상 2시간" 같은 시간대는 조정 가능하게 CMS에서 관리
- 실제 배송 데이터 축적 후 점진적 정확도 개선

---

## 부록: 구현 체크리스트

### Phase 1: 데이터 모델 + Types
- [ ] Product, Collection 타입 정의
- [ ] Order, OrderLine, PaymentInstruction 타입
- [ ] LocalizedText 적용
- [ ] Mock 데이터 생성 (5개 상품, 2개 컬렉션)

### Phase 2: Storefront 핵심 페이지
- [ ] / (홈) - 배송지 확인 UI 포함
- [ ] /shop (메뉴 리스트)
- [ ] /shop/[slug] (상품 상세)
- [ ] /cart
- [ ] /checkout (계좌이체/QR 결제)
- [ ] /order-complete
- [ ] /track-order

### Phase 3: Account 영역
- [ ] /account (대시보드)
- [ ] /account/orders
- [ ] /account/orders/[id]
- [ ] /account/addresses
- [ ] /account/settings
- [ ] /account/points

### Phase 4: 정보 페이지
- [ ] /faq
- [ ] /delivery
- [ ] /contact
- [ ] /terms, /privacy, /refund

### Phase 5: Admin 기본
- [ ] /admin/login
- [ ] /admin/dashboard
- [ ] /admin/orders (payment_status 분리)
- [ ] /admin/orders/[id] (타임라인)
- [ ] /admin/products (다국어 필드)

### Phase 6: Admin CMS 심화
- [ ] /admin/collections
- [ ] /admin/hero-banners
- [ ] /admin/members
- [ ] /admin/points
- [ ] /admin/bank-accounts
- [ ] /admin/payment-reconciliation
- [ ] /admin/delivery-zones
- [ ] /admin/localization

### Phase 7: Admin 나머지
- [ ] /admin/notifications
- [ ] /admin/footer
- [ ] /admin/floating-icons
- [ ] /admin/site-settings
- [ ] /admin/policies
- [ ] /admin/faq

### Phase 8: 통합 테스트
- [ ] 주문 흐름 (비로그인 guest)
- [ ] 주문 추적
- [ ] 다국어 전환
- [ ] Admin에서 상품 수정 → Storefront 반영
- [ ] 결제 정산 workflow

---

이 명세서는 Cursor 또는 Codex가 직접 구현할 수 있도록 구조화되었습니다.
각 페이지/컴포넌트마다 필요한 데이터, 상태, 상호작용이 명확하게 정의되어 있습니다.
