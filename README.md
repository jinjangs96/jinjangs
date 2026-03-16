# Jin Jang's Kitchen - Complete Platform

A full-stack Korean restaurant delivery platform built with Next.js 16, featuring both customer storefront and admin CMS.

## Project Structure

### Storefront (Customer-facing)
All routes under `app/(storefront)/`:
- `/` - Home page with hero carousel, featured products, and promotions
- `/shop` - Product catalog with category filtering
- `/shop/[slug]` - Product detail page with options and customization
- `/cart` - Shopping cart management
- `/checkout` - Order checkout with delivery info and payment
- `/account` - User account dashboard
- `/account/orders` - Order history and tracking
- `/account/points` - Points balance and redemption history
- `/login` - Customer login
- `/register` - New customer registration

### Admin Panel
All routes under `app/admin/`:
- `/login` - Admin authentication
- `/dashboard` - KPI overview (orders, revenue, stats)
- `/orders` - Order management with status tracking
- `/products` - Menu item management with categories and options
- `/hero-banners` - Homepage carousel management
- `/members` - Customer database with tier management
- `/points` - Points policy configuration and transaction history
- `/bank-accounts` - Payment method management with QR upload
- `/notifications` - Email template and customer notification settings
- `/floating-icons` - Quick contact buttons (Zalo, Phone, Kakao, etc.)
- `/footer` - Footer section and link management
- `/site-settings` - Basic site info, contact, delivery policy
- `/policies` - Terms of service, privacy policy, refund policy

## Key Features

### Storefront Features
- **Product Management**: Filterable menu by category (main, side, soup, beverage, set)
- **Customization**: Options and option groups with price variations
- **Cart System**: Context-based cart management with local persistence ready
- **Checkout Flow**: Multi-step checkout with delivery slot selection
- **Member System**: User accounts with points system integration
- **Internationalization-Ready**: Language switcher component with 5 languages (KO > VI > EN > JP > ZH)
- **Responsive Design**: Mobile-first approach with tablet/desktop enhancements

### Admin Features
- **Order Management**: Real-time order status tracking with detail modals
- **Product Editor**: Full CRUD for menu items with option groups
- **Member Analytics**: Customer tier system and purchase history
- **Points System**: Configurable points earn/redemption policy with history
- **Content Management**: Hero banners, policies, footer, floating icons
- **Settings Dashboard**: Site configuration, delivery policy, payment methods
- **Multi-section Navigation**: Organized into 4 main sections (Orders, Products, Members, Settings)

## Data Structure

### Types
All TypeScript interfaces defined in `lib/types.ts`:
- **Orders**: `Order`, `OrderItem`, `OrderTimeline`
- **Products**: `Product`, `ProductCategory`, `ProductOption`, `ProductOptionGroup`
- **Users**: `AdminUser`, `Member`, `MemberTier`
- **Points**: `PointsPolicy`, `PointsLedger`, `PointsTransactionType`
- **Content**: `HeroBanner`, `FloatingIcon`, `SiteSettings`, `PolicyPage`
- **Checkout**: `Cart`, `CartItem`, `CheckoutForm`, `DeliverySlot`

### Mock Data
All mock data in `lib/mock-data.ts`:
- 14 menu products across 5 categories
- 5 customer members with different tiers
- 3 hero banners
- 5 floating contact icons
- 3 policy pages
- Complete points system configuration

## Components

### Storefront Components
- `Header` - Navigation with language switcher
- `LanguageSwitcher` - Multi-language selector (KO/VI/EN/JP/ZH)
- `Footer` - Company info and links
- `FloatingIcons` - Quick contact buttons
- `ProductCard` - Reusable product display

### Shared Utilities
- `useCart()` - Context hook for cart state management
- `CartProvider` - Context provider wrapper
- `cn()` - Tailwind class merging utility

## Design System

### Colors (Wood-tone palette)
- **Primary**: #8B5E34 (warm wood brown)
- **Background**: #FFFBF5 (cream/ivory)
- **Card**: #FFFFFF (white)
- **Accent**: #E8D9C5 (soft beige)
- **Success**: #2E7D32 (green)
- **Muted**: #6B7280 (gray)

### Typography
- **Sans-serif**: Noto Sans KR + Geist (responsive for all languages)
- **Mono**: Geist Mono (for code/technical content)

### Spacing & Radius
- Uses Tailwind v4 spacing scale
- Default border radius: 0.875rem

## Getting Started

### Development
```bash
pnpm install
pnpm dev
```

### Environment Variables
Currently using mock data. For production:
- Add Supabase integration (database + auth)
- Configure payment providers
- Set up email service for notifications

## Project Roadmap (MVP2)

### Phase 1 - Database Integration
- [ ] Supabase setup with Row Level Security
- [ ] User authentication (customer + admin)
- [ ] Real-time order status updates

### Phase 2 - Payment Integration
- [ ] Stripe integration (credit card)
- [ ] MegaPay integration (local Vietnam payment - UI ready, backend pending)
- [ ] Order payment tracking

### Phase 3 - Email & Notifications
- [ ] Email templates (order confirmation, status updates)
- [ ] SMS notifications
- [ ] Admin notification center

### Phase 4 - Analytics
- [ ] Order analytics dashboard
- [ ] Customer behavior tracking
- [ ] Revenue reporting

## File Organization

```
/app
  /(storefront)          # Customer-facing routes
    /account
    /shop
    /cart
    /checkout
    /login
    /register
    layout.tsx
    page.tsx (home)
  /admin                 # Admin panel routes
    /dashboard
    /orders
    /products
    /members
    /points
    /bank-accounts
    /notifications
    layout.tsx
    login/page.tsx

/components
  /storefront           # Customer UI components
    header.tsx
    footer.tsx
    language-switcher.tsx
    product-card.tsx
    floating-icons.tsx
  /admin               # Admin UI components
    status-badge.tsx
    order-detail-modal.tsx

/lib
  types.ts             # All TypeScript interfaces
  mock-data.ts         # Mock data for development
  cart-context.tsx     # Cart state management
  utils.ts             # Utility functions

/public
  /spec               # Documentation files
    ui_tokens.json
    component_spec.json
    copy_strings.ko.json
```

## Development Notes

### Current Language Support
Language switcher UI is ready with proper ordering (KO > VI > EN > JP > ZH). The actual i18n integration is prepared for future implementation via `next-intl` or similar.

### Cart Management
Cart uses React Context for client-side state. Ready for integration with backend persistence via Supabase.

### Admin Navigation
Sidebar automatically highlights current route. Navigation organized into 4 collapsible sections for better UX.

### Hero Banner
Fully responsive carousel with auto-advance, manual controls, and proper center alignment across all screen sizes.

---

**Last Updated**: March 7, 2026
**Status**: Feature Complete (MVP1)
