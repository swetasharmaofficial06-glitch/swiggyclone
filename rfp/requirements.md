# RFP — Most Sold Items (Foodie Hub)

**Project:** Foodie Hub (`swiggy-clone`)
**Branch:** `most-sold-items`
**Date:** 11 Nov 2026

---

## 1. Background

Foodie Hub ek Swiggy-style food ordering app hai (React + Vite + Firebase).
Home page par abhi offers strip aur restaurant grid hai. Customers ko
"Most Sold Items" dikhana hai taaki popular dishes turant nazar aayein aur
ordering badhe.

## 2. Goal

Home page ke offers strip ke **neeche** ek naya section: **"Most Sold Items"** —
jisme admin ke chune hue bestseller dishes cards ke roop mein dikhein.

## 3. Scope

### In scope

- Home page par naya "Most Sold Items" section (offers strip ke baad).
- Admin panel se menu item ko **bestseller** mark / unmark karna.
- Menu item ke saath optional **sold count** set karna.
- Bestsellers ko sold count ke hisaab se sort karke top 10 dikhana.
- Cards par restaurant ka naam, price aur bestseller badge.
- Section tabhi dikhe jab kam se kam ek bestseller ho (warna chhupa rahe).
- Light + dark dono themes mein sahi dikhe.

### Out of scope

- Real order data se automatic aggregation (koi Cloud Function / billing nahi).
- Customer-facing "bestseller" badge restaurant menu page par (phase 2).
- Analytics dashboard / reports.

## 4. Data Model

Firestore path: `restaurants/{restaurantId}/menu/{menuItemId}`

| Field          | Type      | Required | Notes                                      |
| -------------- | --------- | -------- | ------------------------------------------ |
| `isBestseller` | boolean   | haan     | `true` = Home ke Most Sold section mein     |
| `soldCount`    | number    | nahi     | Sort order ke liye; na ho to `0` maana jaye |

Query: `collectionGroup('menu')` + `where('isBestseller', '==', true)`
(single-field index, Spark plan par kaam karta hai).

## 5. Functional Requirements

| ID    | Requirement                                                                                   |
| ----- | --------------------------------------------------------------------------------------------- |
| FR-1  | Home page par offers strip ke turant baad "🔥 Most Sold Items" heading ke saath section render ho. |
| FR-2  | Section sirf tab render ho jab ek ya zyada bestseller item mile.                               |
| FR-3  | Har card par: item image (fallback gradient), naam, restaurant naam, price, badge.               |
| FR-4  | Badge: `soldCount > 0` ho to "🔥 {count} sold", warna "⭐ Bestseller".                          |
| FR-5  | Items `soldCount` descending order mein sort hon; maximum 10 cards.                            |
| FR-6  | Admin menu list mein har item ke saath ★/☆ toggle ho jo turant Firestore update kare.           |
| FR-7  | Add-item form mein "Bestseller" checkbox aur optional "Sold count" input ho.                    |
| FR-8  | Card click karne par us restaurant ke menu page par navigate ho.                               |
| FR-9  | Data realtime update ho (Firestore `onSnapshot`) — admin toggle karte hi Home par reflect ho.    |
| FR-10 | Koi console error na aaye; query fail ho to section silently hide ho (page na toote).           |

## 6. Non-Functional Requirements

- **Cost:** Firebase Spark plan — koi billing/Cloud Functions nahi.
- **Performance:** Section ka query lightweight ho; Home ka pehla render block na ho.
- **Accessibility:** Cards keyboard se focusable (`<Link>`), badge par readable text.
- **Responsive:** Mobile (≤720px) par horizontal scroll, desktop par grid.
- **Theming:** Sab colors CSS variables se (`var(--surface)`, `var(--text)`, etc.).
- **Security:** Menu writes sirf admin ke liye (existing `firestore.rules`).

## 7. UX Flow

1. Admin `/admin` khole → restaurant select kare → menu item ke saath **☆ Bestseller** dabaye.
2. Button **★ Bestseller** ho jaye; optional sold count set kare.
3. Home khole → offers ke neeche "Most Sold Items" section mein woh dish dikhe.
4. Card click → restaurant page → item order ho sake.

## 8. Acceptance Criteria

- [ ] Admin `isBestseller: true` kare to Home par item 5 second ke andar dikhe.
- [ ] `soldCount` zyada wala item pehle aaye.
- [ ] 10 se zyada bestseller hon to sirf top 10 dikhein.
- [ ] Ek bhi bestseller na ho to section bilkul na dikhe.
- [ ] Light aur dark dono themes mein text contrast theek ho.
- [ ] `npm run lint` aur `npm run build` clean pass hon.
- [ ] Mobile width par layout toote nahi.

## 9. Technical Notes

| Area            | File                                              |
| --------------- | ------------------------------------------------- |
| Section UI      | `src/pages/Home.jsx`                              |
| Data hook       | `src/hooks/useBestsellers.js`                     |
| Admin toggle    | `src/pages/AdminPage.jsx` (`MenuManager`)         |
| Add-item form   | `src/components/MenuItemForm.jsx`                 |
| Service         | `src/services/menuService.js` (`updateMenuItem`)  |
| Styles          | `src/index.css`                                   |
| Security rules  | `firestore.rules`                                 |

## 10. Future Enhancements

- Restaurant menu page par bhi "Bestseller" badge.
- Real orders se monthly auto-refresh (Cloud Function — paid plan chahiye).
- Category-wise bestsellers (Biryani, Pizza, etc.).
- Admin dashboard mein "top 10 by revenue" report.
