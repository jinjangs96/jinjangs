# QUICK REFERENCE - Jin Jang's Kitchen Phase 2
## One-Page Implementation Checklist

---

## NEW TYPES (Add to lib/types.ts)
- `ProductImage` — Image metadata (featured, order, URL)
- `ProductOptionPriceRule` — Toggle + amount for option pricing
- `ProductOptionValue` — Individual option (replaces ProductOption)
- `ProductOptionGroup` (updated) — Now uses ProductOptionValue[], add product_id
- `ProductBadge` type — 'popular' | 'beginner_friendly' | etc.
- `PointsConfig` — Simple MVP rules
- `PointsTransaction` — Ledger entries

## UPDATED TYPES (Edit in lib/types.ts)
- `Product` — Add images[], badges[], food info fields (storage, allergens, ingredients, weight, shelf_life, warnings)
- `ProductOption` — Mark DEPRECATED, keep for backward compat

---

## NEW COMPONENTS
```
components/storefront/
  - product-image-gallery.tsx          (main gallery + thumbnails)
  - product-option-selector.tsx        (radio/checkbox cards for options)
  - points-card.tsx                    (balance summary)
  - points-ledger-table.tsx            (transaction history)

components/admin/
  - product-image-upload.tsx           (drag-drop multi-image)
```

## ENHANCED COMPONENTS
```
components/storefront/
  - product-card.tsx                   (add badges, use images[0])
```

---

## PAGES TO UPDATE

| Page | What's New |
|------|-----------|
| `/shop/[slug]` | Gallery + options + food info + recommendations |
| `/account/points` | Balance card + ledger table with filters |
| `/admin/products` | Multi-image upload + option editor + food fields |

---

## MOCK DATA UPDATES

Update `MOCK_PRODUCTS` structure:
- Populate `images[]` array (featured + gallery)
- Restructure option groups → option_values
- Add food info fields
- Add badges array
- Keep `image_url` (backward compat)

Add new exports:
- `MOCK_POINTS_CONFIG`
- `MOCK_POINTS_TRANSACTIONS`

---

## KEY DECISIONS MADE

✓ Multi-image: `ProductImage[]` array, is_featured boolean  
✓ Options: `ProductOptionGroup.option_values[]` instead of `options[]`  
✓ Pricing: `ProductOptionPriceRule` toggles apply_price_delta on/off  
✓ Points: Simple MVP (10k VND = 1pt, 50pt = 50k discount)  
✓ Spacing: 24px mobile, 32px desktop (use gap-6 / gap-8)  
✓ Wood texture: Subtle, opacity 0.02-0.03, only on section backgrounds  
✓ Mobile-first: Design gallery, forms, tables for mobile first  

---

## IMPLEMENTATION ORDER

1. ✅ types.ts — Add new types, update Product
2. ✅ mock-data.ts — Update MOCK_PRODUCTS, add MOCK_POINTS_*
3. ProductImageGallery — Component
4. ProductOptionSelector — Component
5. PointsCard + PointsLedgerTable — Components
6. AdminProductImageUpload — Component
7. /shop/[slug] — Integrate gallery, options, food info
8. /account/points — New tab UI with filters
9. /admin/products — Add image upload, option editor, food fields
10. ProductCard — Update for new images/badges
11. Spacing fixes on /account pages
12. Wood texture styling to globals.css

---

## TESTING PRIORITIES

- [ ] Product detail: gallery swipe/tap works on mobile
- [ ] Options: Required defaults, price updates in real-time
- [ ] Points: Ledger shows running balance correctly
- [ ] Admin: Image reorder persists, option validation works
- [ ] Mobile: No layout breaks, spacing breathes
- [ ] Performance: Images don't lazy-load too late (use priority on featured)

---

## DEPLOYMENT NOTES

- Backward compatible during migration (keeps image_url)
- No database changes needed yet (still using mock data)
- When moving to Supabase/DB: Migrate ProductImage → separate table with product_id FK
- Points ledger: Add member_phone FK in database
- No payment integration yet (MegaPay marked "예정")

---

## QUESTIONS FOR STAKEHOLDERS

- Should option-specific images auto-swap gallery on select? (nice-to-have)
- Should recommendations section be MVP1 or defer? (currently optional)
- Should points have tier multipliers in MVP1? (no, structure ready for MVP2)
- Should food warnings show preset list or free text? (free text for MVP1)

---

END REFERENCE
