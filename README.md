# 🍔 Swiggy Clone — React + Firebase

Swiggy-style food ordering app: restaurants browse karo, search/filter karo, menu dekho, cart
banao, checkout karo — aur **admin panel se restaurants + menu items add karo**. Images app ke
saath bundled hain (`public/images/`), koi Storage setup ya billing ki zaroorat nahi.
Order place karne ke liye **Google sign-in zaroori** hai.

Stack: **React 19 + Vite + React Router + Firebase (Auth + Firestore + Hosting)**.

## ✨ Features

- 🔥 **Realtime restaurant list** — Firestore `onSnapshot`
- 🔍 **Search + cuisine chips + filters** (Pure Veg, Rated 4.0+, Fast Delivery, Great Offers) + sorting
- 📖 **Restaurant page** with category-wise menu, veg/non-veg indicators, offers
- 🛒 **Cart** — Context + reducer, localStorage persist, "ek cart = ek restaurant" rule
- 🔐 **Google sign-in** — Firebase Auth popup, navbar mein avatar/account menu, session restore
- 🧾 **Checkout (login required)** — signed out pe Google sign-in card, signed in pe naam
  prefilled + email; Swiggy-style bill breakdown (Item Total + Delivery Fee + Platform Fee +
  GST), order Firestore `orders` mein `userId` ke saath save
- 📦 **My Orders** (`/orders`) — account menu se khulta hai, realtime order list with status
- 🔥 **Most Sold Items** — Home page par offers ke neeche bestseller dishes; admin menu item ko
  ⭐ bestseller mark kare (optional sold count ke saath), section sold count se sorted top 10 dikhata hai
- 🌗 **Light/dark toggle** — navbar ke ☀️/🌙 button se theme switch, choice `localStorage` mein
  yaad rehti hai (pehla paint bhi flash-free)
- 🛡️ **Admin lock** — `/admin` email/password (ya Google) login + `admin: true` custom claim;
  panel mein password change ka option bhi hai
- 🚴 **Free delivery nudge** — ₹499 se upar delivery free
- 🛍️ **Sticky "View Cart" bar** — Swiggy jaisa
- 👩‍🍳 **Admin panel** (`/admin`) — restaurant + menu add/delete, **image picker** (bundled
  images se choose karo ya apna URL/path daalo) with live preview
- 🌱 **Sample data loader** — ek click mein 16 demo restaurants + menus
- 🎨 Swiggy-style UI — orange theme, offer cards, green rating badges, responsive layout
- 🧱 Good practices — services layer, custom hooks, route-level code splitting, error
  boundary, loading/empty states, `.env` config, security rules, accessible labels

## 📁 Folder structure

```
swiggy-clone/
├── firebase.json             # Hosting + Firestore config
├── firestore.rules           # Security rules (admin claim + own orders)
├── .firebaserc               # Project ID (webufire)
├── .env.example              # Firebase config template
├── scripts/
│   └── grant-admin.mjs       # admin custom claim grant/revoke
├── public/images/            # Bundled images (restaurants + menu)
└── src/
    ├── main.jsx              # Entry point (+ setup guard)
    ├── App.jsx               # Routing + cart drawer
    ├── constants.js
    ├── data/
    │   ├── sampleData.js     # 16 demo restaurants + menus
    │   └── sampleImages.js   # image picker ke options
    ├── services/             # 🔥 Saare Firebase calls
    │   ├── firebase.js
    │   ├── authService.js    # Google sign-in / sign-out
    │   ├── restaurantService.js
    │   ├── menuService.js
    │   └── orderService.js   # placeOrder + subscribeMyOrders
    ├── hooks/                # useRestaurants, useRestaurant, useMenuItems, useCart, useUI, useAuth
    ├── context/              # authContext + AuthProvider, cartContext + CartProvider, UIProvider
    ├── components/           # Navbar, UserAvatar, GoogleIcon, RestaurantCard, MenuItemCard,
    │                         # CartDrawer, CartBar, ImagePicker, SmartImage, forms, Loader…
    ├── pages/                # Home, RestaurantPage, AdminPage, MyOrdersPage, NotFound
    └── utils/format.js       # price, bill calculation, sorting helpers
```

## 🚀 Local setup

### 1. Firebase project banao

1. https://console.firebase.google.com → **Add project**
2. **Build → Firestore Database → Create database** (start in test mode)
3. **Project Settings → Your apps → Web app `</>` add** → config values copy karo

### 2. `.env` banao

```bash
cd swiggy-clone
cp .env.example .env
```

`.env` mein values bharo (quotes nahi lagane):

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=tumhara-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tumhara-project
VITE_FIREBASE_STORAGE_BUCKET=tumhara-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123...
```

### 3. Dev server

```bash
npm install
npm run dev
```

App khulne ke baad **Admin → Load sample data** dabao — Home page pe 16 restaurants aa jayenge. 🎉

> 🛡️ Admin panel ab login + `admin` custom claim maangta hai. Pehle app se Google sign-in
> karo, phir claim grant karo: `npm run admin:grant -- tumhara-email@example.com`
> (detail neeche "Admin access" section mein).

## 🚢 Firebase pe deploy

**Live:** https://webufire.web.app (project `webufire`)

```bash
firebase login          # one-time
npm run deploy          # build + hosting + Firestore rules
```

> ℹ️ `swiggy-clone/.firebaserc` mein project `webufire` set hai.
> Hosting site: `webufire.web.app` / `webufire.firebaseapp.com`.

## 🔐 Google sign-in (order ke liye)

Order place karne ke liye Google login zaroori hai. Signed-out user checkout kholta hai toh
sign-in card dikhta hai; sign-in ke baad naam auto-fill ho jata hai aur order uske account se
link ho jata hai.

**Firebase Console setup (one-time):**

1. Firebase Console → **Build → Authentication → Sign-in method → Google → Enable**
2. **Authentication → Settings → Authorized domains** mein ye hone chahiye:
   `localhost`, `<project>.firebaseapp.com`, `<project>.web.app`
3. Support email select karke **Save** karo

**Code kahan hai:**

| File | Kaam |
|---|---|
| `src/services/authService.js` | Google popup + email/password sign-in, password change, errors |
| `src/context/AuthProvider.jsx` | Session restore (`onAuthStateChanged`) + admin claim state |
| `src/components/Navbar.jsx` | Sign-in button, avatar + account menu (My orders / Sign out) |
| `src/components/CartDrawer.jsx` | Checkout ko auth ke peeche gate karta hai |
| `src/services/orderService.js` | `userId` + `customer.email` order mein save, `subscribeMyOrders` |
| `src/pages/MyOrdersPage.jsx` | `/orders` — apne orders realtime list |
| `firestore.rules` | Order create sirf apne `uid` ke liye; admin claim se admin access |

## 🛡️ Admin access (email/password + custom claim)

Admin panel **login + `admin: true` custom claim** dono ke peeche locked hai. Admin login ke
do tarike hain:

1. **Email + password** (default) — `/admin` pe form
2. **Google sign-in** — same admin account se

**Current admin account:**

| | |
|---|---|
| Email | `swetasharmaofficial06@gmail.com` |
| UID | `DHt2h5sGRUYMdeOno3uZQUx8Pff2` |
| Login | email/password (Google bhi linked hai) |
| Password | app ke bahar securely share kiya gaya — **Admin → 🔑 Admin password badlo** se turant change kar lo |

**Firebase Console setup (one-time):**

- **Authentication → Sign-in method → Email/Password → Enable** (admin login ke liye)
- **Authentication → Sign-in method → Google → Enable** (customers + Google admin login)

**Naya admin banana ho toh:**

```bash
# jis Google account ko admin banana hai, usse app mein ek baar sign in karo
npm run admin:grant -- email@example.com
```

Script Firebase CLI ke login token se claim set karti hai (Admin SDK / service account ki
zaroorat nahi). Output mein uid + claims dikhte hain.

- **Access check:** `/admin` kholo → claim automatically verify ho jata hai. Agar pehle se
  logged in ho aur claim abhi set hua hai, **"🔄 Access dobara check karo"** dabao (token refresh).
- **Revoke:** `npm run admin:grant -- email@example.com --revoke`
- **Rules:** `restaurants` aur `menu` ki writes sirf `isAdmin()` ke liye; reads public.

## 📦 My Orders

- Navbar → avatar → **📦 My orders** (`/orders`)
- Order ke success screen se bhi "View my orders" milta hai
- Query: `orders` jahan `userId == apna uid`, newest first (client-side sort — koi composite
  index nahi chahiye)
- Realtime `onSnapshot` — status change hote hi update ho jata hai (statuses: `placed`,
  `accepted`, `outForDelivery`, `delivered`, `cancelled`)

## 🖼️ Images kahan se aati hain

Images **Firebase Storage use nahi karti** — app ke saath bundled hain, isliye koi billing
ya Storage setup nahi chahiye:

- `public/images/restaurants/*.jpg` — restaurant cover images (16)
- `public/images/menu/*.jpg` — menu item images (37)
- **License:** sab images **CC0 / Public Domain** hain (Wikimedia Commons se) — free use,
  attribution ki zaroorat nahi. Detail `public/images/CREDITS.json` mein (title, creator,
  license, source link).
- Admin panel ka **ImagePicker** inhi bundled images ka gallery dikhata hai — ek click mein select
- Apni image chahiye toh file ko `public/images/...` mein daalo, ya picker mein koi bhi
  image URL type karo (e.g. `https://…/photo.jpg`)
- `src/data/sampleImages.js` mein picker ke options define hain
- Image missing/broken ho toh `SmartImage` gradient + emoji placeholder dikhata hai

> 💡 Chrome mein image compress karke `public/images/` mein rakhna best practice hai —
> page load fast rehta hai aur hosting bandwidth bachti hai.

## 🔒 Security note (production)

- **Auth:** `webufire` project mein Google provider enabled hai. Authorized domains:
  `localhost`, `webufire.web.app`, `webufire.firebaseapp.com`.
- **Orders:** `create` sirf signed-in user ke liye — `request.resource.data.userId` uske
  `request.auth.uid` se match karta hai, aur `customer.email` token ke email se. Read apne
  orders (ya admin ko sab); update/delete client se band.
- **Restaurants/menu:** read public, **write sirf admin** (`admin == true` custom claim).
- **Admin panel:** Google login + admin claim ke bina kuch bhi add/delete nahi hota — UI gate
  aur Firestore rules, dono level pe.

> ℹ️ Admin claim grant/revoke: `npm run admin:grant -- email@example.com [--revoke]`.
> Claim hatane ke baad user ka token refresh hone tak purana access reh sakta hai (max ~1 hour),
> isliye revoke ke baad usse sign out → sign in karwao.

## 🧭 Aage kya add kar sakti ho

- 🚚 Admin orders screen + status update (`placed` → `accepted` → `delivered`)
- 📝 Restaurant/menu edit functionality
- 🗺️ Location-based restaurant filtering
- 🎨 Tailwind/shadcn se aur polish

Happy building! 🚀
