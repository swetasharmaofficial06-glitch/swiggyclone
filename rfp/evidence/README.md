# Evidence — Most Sold Items

**Feature:** Home page "🔥 Most Sold Items" (admin-curated bestsellers)
**Branch:** `most-sold-items` (commit `2a39b0b`)
**Site tested:** https://webufire.web.app (production)
**Tool:** `playwright-cli` v0.1.24 (Chromium)
**Date:** 11 Nov 2026

---

## Test environment

| | |
|---|---|
| Browser | Chromium (playwright-cli default session) |
| Desktop viewport | 1440 × 1000 |
| Mobile viewport | 390 × 844 |
| Data | 4 bestsellers in Firestore (3 with sold count, 1 without) |
| Console errors | 0 (checked via `playwright-cli console error`) |

## Test cases

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
