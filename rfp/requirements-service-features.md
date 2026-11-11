# RFP — Service Features (Foodie Hub)

**Project:** Foodie Hub (`swiggy-clone`)
**Branch:** `service-features`
**Date:** 11 Nov 2026

---

## 1. Background

Foodie Hub par ordering flow ready hai (restaurants → menu → cart → checkout → My Orders).
Ab teen customer-facing service features add karne hain jo real food-delivery apps mein
expected hain: **live order tracking**, **coupons** aur **saved addresses**.

Constraint: **Firebase Spark plan** (koi billing / Cloud Functions nahi), images local.

## 2. Scope

### In scope

1. **Live order tracking** — customer ko order ka status timeline dikhe, admin status badale.
2. **Coupons** — checkout par fixed coupon codes, bill mein discount.
3. **Saved addresses** — alag page (`/addresses`) + checkout par select/save.

### Out of scope

- Payment gateway (demo COD/UPI label hi).
- Coupon admin CRUD (codes code mein fixed hain).
- Order cancellation by customer (sirf admin).
- Delivery-partner app / live map.

## 3. Functional Requirements

### A. Live order tracking

| ID    | Requirement |
| ----- | ----------- |
| FR-A1 | Order statuses: `placed → accepted → outForDelivery → delivered`, plus `cancelled`. |
| FR-A2 | `/orders` par har order ke saath 4-step timeline; done steps ✓, active step highlighted, pending steps muted. |
| FR-A3 | Har step ke saath uska time dikhe (status history se). |
| FR-A4 | `cancelled` order alag red card dikhaye (timeline ki jagah). |
| FR-A5 | Admin panel (`/admin`) mein **Orders** section — newest first, top 20. |
| FR-A6 | Admin har order ka status **dropdown** se koi bhi valid status set kar sake. |
| FR-A7 | Status change realtime customer ke My Orders par reflect ho (`onSnapshot`). |
| FR-A8 | Order document mein `status` + `statusHistory[]` (`{status, at}`) save ho. |

### B. Coupons

| ID    | Requirement |
| ----- | ----------- |
| FR-B1 | Checkout par coupon input + Apply/Remove + suggestion chips. |
| FR-B2 | Codes fixed: `WELCOME50` (50% up to ₹100, min ₹199), `FREEDEL` (free delivery, min ₹299), `FLAT50` (₹50 off, min ₹399). |
| FR-B3 | Invalid code par error message; bill na badle. |
| FR-B4 | Min order se kam cart par apply na ho — expected amount ke saath error. |
| FR-B5 | Bill mein discount line (`🎟️ Coupon (CODE)  − ₹X`) aur To Pay updated ho. |
| FR-B6 | `FREEDEL` delivery fee ko FREE kare (discount amount 0). |
| FR-B7 | Order par `discount` + `couponCode` save hon; My Orders card par "Saved ₹X" dikhe. |

### C. Saved addresses

| ID    | Requirement |
| ----- | ----------- |
| FR-C1 | Alag page `/addresses`, navbar account menu se accessible. |
| FR-C2 | Address fields: label (Home/Work/Other), full address, 10-digit mobile, default checkbox. |
| FR-C3 | Max **5** addresses per user; limit par add disable + message. |
| FR-C4 | Edit, delete aur "Set default" (ek hi default) supported ho. |
| FR-C5 | Checkout par saved addresses one-click select → phone + address autofill. |
| FR-C6 | Checkout par "Ye address future ke liye save karo" checkbox + label chips. |
| FR-C7 | Data `users/{uid}/addresses` mein; sirf owner read/write kar sake. |

## 4. Data Model

### Orders — `orders/{orderId}` (existing collection, naye fields)

| Field           | Type      | Notes |
| --------------- | --------- | ----- |
| `status`        | string    | `placed` / `accepted` / `outForDelivery` / `delivered` / `cancelled` |
| `statusHistory` | array     | `[{ status, at: Timestamp }]`, `arrayUnion` se append |
| `discount`      | number    | Coupon se saved amount (₹) |
| `couponCode`    | string    | Applied code ya `''` |

### Addresses — `users/{userId}/addresses/{addressId}`

| Field       | Type      | Required |
| ----------- | --------- | -------- |
| `label`     | string    | haan (Home/Work/Other) |
| `address`   | string    | haan (≥10 chars) |
| `phone`     | string    | haan (10-digit) |
| `isDefault` | boolean   | haan |
| `createdAt` | timestamp | haan |

## 5. Security Rules

- `orders` update: **sirf admin**, aur sirf `status` + `statusHistory` fields;
  `status` valid list mein ho.
- `users/{uid}/addresses`: read/write/delete sirf owner; create par fields + lengths validate.
- `orders` create: signed-in user, `userId == auth.uid` (pehle se tha).

## 6. Non-Functional Requirements

- **Cost:** Spark plan — koi Cloud Function / billing nahi; client-side sorting.
- **Realtime:** Firestore `onSnapshot` (orders, addresses).
- **Performance:** Naye pages route-level lazy loaded; Firestore checkout par dynamic import.
- **Responsive:** Mobile (390px) par timeline horizontally scrollable, admin rows stack.
- **Theming:** Light + dark, CSS variables.
- **Validation:** Phone regex `^[6-9]\d{9}$`, address ≥10 chars, max 5 addresses.

## 7. Acceptance Criteria

- [x] Admin dropdown se status badle to customer timeline 2 second ke andar update ho.
- [x] Timeline mein pending steps muted, done ✓, active highlighted.
- [x] `WELCOME50` par ₹100 tak discount, `FREEDEL` par delivery FREE, `FLAT50` par ₹50 off.
- [x] Invalid / min-order se kam coupon apply na ho aur error dikhe.
- [x] Order par coupon save ho aur My Orders mein "Saved ₹X" dikhe.
- [x] `/addresses` se address add/edit/delete/default ho; max 5 enforce ho.
- [x] Checkout par saved address select karne se phone + address bhar jaye.
- [x] Light/dark + mobile par layout toote nahi; console errors 0.
- [x] `npm run lint` + `npm run build` clean.

## 8. Technical Notes

| Area | File |
| ---- | ---- |
| Order service (status/history) | `src/services/orderService.js` |
| Orders hook (admin) | `src/hooks/useAllOrders.js` |
| Admin orders UI | `src/pages/AdminPage.jsx` (`OrdersManager`) |
| Customer timeline | `src/pages/MyOrdersPage.jsx` |
| Coupon logic | `src/utils/coupon.js` |
| Coupon constants | `src/constants.js` (`COUPONS`) |
| Address service/hook | `src/services/addressService.js`, `src/hooks/useAddresses.js` |
| Addresses page | `src/pages/AddressesPage.jsx` |
| Checkout UI | `src/components/CartDrawer.jsx` |
| Routes / nav | `src/App.jsx`, `src/components/Navbar.jsx` |
| Security rules | `firestore.rules` |
| Styles | `src/index.css` |

## 9. Evidence

Screenshots + test table: `rfp/evidence/README.md` (tests 11–20).
