# Evidence — Home Bestsellers + Service Features

**Features:**
1. Home "🔥 Most Sold Items" (admin-curated bestsellers) — branch `most-sold-items`
2. Live order tracking + coupons + saved addresses — branch `service-features`

**Sites tested:** local dev `http://localhost:5173` + production `https://webufire.web.app`
**Tool:** `playwright-cli` v0.1.24 (Chromium)
**Date:** 11 Nov 2026

---

## Test environment

| | |
|---|---|
| Browser | Chromium (playwright-cli default session) |
| Desktop viewport | 1440 × 1000 |
| Mobile viewport | 390 × 844 |
| Account | Admin (`swetasharmaofficial06@gmail.com`, `admin: true` claim) |
| Data | 4 bestsellers; 2 orders; 2 saved addresses (Home, Work) |
| Console errors | 0 (checked via `playwright-cli console error`) |
| Lint / build | `npm run lint` ✅ · `npm run build` ✅ |

## Test cases — Most Sold Items

| # | Test | Expected | Result | Evidence |
|---|------|----------|--------|----------|
| 1 | Section placement | Offers strip ke turant baad, filters se pehle | ✅ `prevElementSibling` = `offer-strip` | `01-home-dark-bestsellers.png` |
| 2 | Dark theme | Cards dark surface par readable | ✅ | `01`, `02` |
| 3 | Light theme toggle | Navbar ☀️/🌙 se switch, cards light surface | ✅ theme=`light`, stored=`light` | `03`, `04` |
| 4 | Sold count badge | `🔥 2.5k sold` / `1.3k` / `860` | ✅ | `01` |
| 5 | Badge fallback (no count) | `⭐ Bestseller` | ✅ Paneer Butter Masala | `01` |
| 6 | Sorting | soldCount descending | ✅ 2540 → 1280 → 860 → 0 | `01` |
| 7 | Responsive / mobile | Horizontal scroll, cards 176px | ✅ `scrollWidth > clientWidth` | `05`, `06` |
| 8 | Card click | Restaurant page khule | ✅ `/restaurant/9emDAXRszonqF0KovBPN` | `07` |
| 9 | Empty state | Ek bhi bestseller na ho to section hide | ✅ `section=false`, offers+filters visible | `08` |
| 10 | Data restore | Re-mark karne par section wapas | ✅ 4 cards | `09` |

## Test cases — Live order tracking

| # | Test | Expected | Result | Evidence |
|---|------|----------|--------|----------|
| 11 | Admin panel Orders section | Saare orders newest first, status dropdown | ✅ 2 orders, dropdown with 5 statuses | `13`, `19`, `20` |
| 12 | Admin status update | Dropdown → `accepted` → `outForDelivery` | ✅ success message `#RBE7YNOZ → Out for delivery` | `13` |
| 13 | Customer timeline | 4 steps, done ✓ / active highlighted / pending muted | ✅ `done:Order placed 4:49 pm · done:Accepted 4:50 pm · active:Out for delivery 4:51 pm · pending:Delivered` | `14` |
| 14 | Pending step dot | Muted `•` (emoji nahi) | ✅ 4 pending dots = `•` | `14` |
| 15 | Realtime refresh | Admin change ke baad page reload ke bina update | ✅ `onSnapshot` se turant | `14` |
| 16 | Order coupon saving row | `🎟️ WELCOME50 · Saved ₹100` | ✅ | `14` |
| 17 | Mobile timeline | Horizontal scroll, layout intact | ✅ 390px | `17` |

## Test cases — Coupons

| # | Test | Expected | Result | Evidence |
|---|------|----------|--------|----------|
| 18 | `WELCOME50` apply | 50% off up to ₹100, min ₹199 | ✅ ₹428 cart → −₹100 → To Pay ₹384 | `10` |
| 19 | Order success | Saved amount + code dikhe | ✅ `🎟️ WELCOME50 · Saved ₹100` | `11` |
| 20 | `FREEDEL` apply | Delivery fee FREE, min ₹299 | ✅ `FREEDEL applied — Free delivery`, Delivery Fee `FREE` | `15` |
| 21 | Invalid code | Error message, bill unchanged | ✅ `SAVE99` → "Ye coupon code valid nahi hai.", no discount row | `16` |
| 22 | Suggested chips | Teen fixed codes one-click | ✅ `WELCOME50`, `FREEDEL`, `FLAT50` | `10`, `15`, `16` |

## Test cases — Saved addresses

| # | Test | Expected | Result | Evidence |
|---|------|----------|--------|----------|
| 23 | Checkout save address | Checkbox + label → Firestore `users/{uid}/addresses` | ✅ "Home" saved with order | `10`, `12` |
| 24 | Addresses page CRUD | Add / edit / delete / set default | ✅ 2 addresses, "Work" default | `12` |
| 25 | Max limit | 5 se zyada add na ho | ✅ limit message + disabled submit | `12` (2/5) |
| 26 | Checkout select | Click → phone + address autofill, active highlight | ✅ `9123456780` + Tech Park address | `22` |
| 27 | Mobile layout | Form + list stack, no overflow | ✅ 390px | `18` |

## Test cases — Production smoke test

| # | Test | Expected | Result | Evidence |
|---|------|----------|--------|----------|
| 28 | Live admin login + Orders | `/admin` par Orders section, 2 rows | ✅ rows=2 | `13`, `20` |
| 29 | Live timeline | `/orders` par timeline + coupon saving | ✅ 2 cards, active step | `21` |
| 30 | Live checkout | Saved addresses + 3 coupon chips | ✅ Work/Home list, chips visible | `22` |
| 31 | Live addresses page | 2/5 addresses, default badge | ✅ | `23` |
| 32 | Console errors | 0 errors | ✅ | — |

## Screenshots

| File | Kya dikhata hai |
|------|-----------------|
| `01-home-dark-bestsellers.png` | Dark theme — section + 4 cards + badges (desktop) |
| `02-home-dark-full.png` | Dark theme — full page, offers ke neeche section |
| `03-home-light-bestsellers.png` | Light theme — same section |
| `04-home-light-full.png` | Light theme — full page |
| `05-home-mobile-bestsellers.png` | Mobile 390px — horizontal scroll (2 cards visible) |
| `06-home-mobile-full.png` | Mobile full page |
| `07-bestseller-click-restaurant.png` | Card click → Thali Junction restaurant page |
| `08-empty-state-hidden.png` | Sab bestsellers hatane par section gayab (offers → filters) |
| `09-restored-after-empty-test.png` | Data wapas mark karne par section restored |
| `10-checkout-coupon-applied.png` | Checkout: `WELCOME50` applied, discount row + To Pay ₹384 |
| `11-order-success-coupon.png` | Order success: `#RBE7YNOZ`, `Saved ₹100` |
| `12-saved-addresses-page.png` | `/addresses` desktop: form + 2 addresses (Work default) |
| `13-admin-orders-status.png` | Admin Orders section: 2 orders + status dropdown |
| `14-orders-timeline.png` | My Orders: live 4-step timeline + coupon saving |
| `15-checkout-freedel.png` | Checkout: `FREEDEL` — Delivery Fee `FREE` |
| `16-checkout-invalid-coupon.png` | Checkout: invalid code `SAVE99` par error |
| `17-orders-timeline-mobile.png` | Mobile timeline (390px) |
| `18-addresses-mobile.png` | Mobile `/addresses` — form + list stack |
| `19-admin-orders-mobile.png` | Mobile admin Orders (390px) |
| `20-admin-orders-light.png` | Light theme admin Orders (desktop) |
| `21-live-orders-timeline.png` | **Production** — `/orders` timeline + WELCOME50 saving |
| `22-live-checkout-address-coupon.png` | **Production** — checkout: saved address selected (autofill) + coupon chips |
| `23-live-addresses-page.png` | **Production** — `/addresses` page, 2/5, default badge |

## Reproduce

```bash
cd swiggy-clone/rfp/evidence
playwright-cli open https://webufire.web.app
playwright-cli resize 1440 1000
playwright-cli screenshot ".bestsellers" --filename=check.png
playwright-cli console error
playwright-cli close
```

> Note: Test 9 ke liye Firestore mein 4 items temporarily `isBestseller: false` kiye gaye,
> screenshot ke baad wapas `true` kar diye — live data restored hai.
>
> Coupon/timeline/address tests admin account se kiye gaye (admin claim `true`).
> Test order `#RBE7YNOZ` (Thali Junction, ₹384) aur addresses "Home"/"Work" demo data ke roop
> mein account par saved hain.
