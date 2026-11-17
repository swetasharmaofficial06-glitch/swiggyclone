# RFP — Website to App (Foodie Hub)

**Project:** Foodie Hub (`swiggy-clone`)
**Branch:** `website2app`
**Date:** 17 Nov 2026

---

## 1. Background

Foodie Hub abhi ek **web-only** SPA hai: React 19 + Vite 8 + React Router 7 + Firebase
(Auth + Firestore + Hosting), deployed at `webufire.web.app`. Kohi `manifest`, service
worker ya native shell nahi hai — isliye phone par sirf browser tab ki tarah khulta hai.

Ab isi website ko **app** banana hai: home screen par icon, splash screen,
offline support aur Play Store / App Store par installable build — **bina UI rewrite kiye**
aur **bina manually har release par 20 commands chalane ke**.

Constraint: **Firebase Spark plan** (koi billing / Cloud Functions nahi), aur
team chhoti hai — isliye har repeatable kaam **script/CI se automate** hoga.

## 2. Goal

Ek hi codebase se **do artifacts**:

1. **PWA** — installable web app (`https://webufire.web.app`), auto-update, offline shell.
2. **Native shell** — Capacitor wrapper se `Android .aab` aur `iOS .ipa`.

Aur dono ke liye **one-command release**: `npm run app:release:android` /
`npm run app:release:ios`, plus tag push par GitHub Actions se fully automated.

## 3. Scope

### In scope

- PWA layer: manifest, icons, service worker (autoUpdate), offline app shell, install prompt.
- Capacitor shell: Android + iOS projects, splash screen, app icon, status bar, safe areas.
- Mobile behavior fixes: Android hardware back button, safe-area insets, native auth redirect,
  deep links (`/restaurant/:id`), Firestore offline cache.
- Native-only detection (`Capacitor.isNativePlatform()`) — web par PWA, native par shell behavior.
- **Automation:** npm scripts, version sync, keystore generate script, signed builds,
  Play Store internal-track upload, TestFlight upload, CI workflow.
- Versioning: `package.json` version → `versionName` / `versionCode` / `MARKETING_VERSION` auto.
- Store listing assets generate karna (icon set + splash) ek hi source image se.

### Out of scope

- UI/UX redesign ya React Native rewrite (web code hi reuse hoga).
- Push notifications (phase 2 — FCM/APNs setup alag RFP).
- Payment gateway (physical goods hain, abhi COD/UPI label hi).
- Admin app alag banana (`/admin` same shell mein chalega).
- Live map / delivery partner tracking.
- OTA JS update service (Capacitor live updates) — store policy risk, phase 2.

## 4. Architecture

```
                 ┌─────────────── ek hi src/ ───────────────┐
                 │  React 19 + Vite + React Router + Firebase │
                 └───────────────────┬────────────────────────┘
                                     │ npm run build
                              ┌──────▼──────┐
                              │    dist/    │
                              └──┬───────┬──┘
              firebase deploy    │       │   npx cap sync
                    ┌────────────▼┐   ┌──▼─────────────┐
                    │  Firebase   │   │ android/  ios/  │
                    │  Hosting    │   │ (native shell)  │
                    │  (PWA)      │   └──┬──────────┬───┘
                    └─────────────┘      │          │
                                    .aab │          │ .ipa
                                   Play  ▼          ▼ App Store
```

- **Backend same:** Firestore, Auth, rules, data model — kuch nahi badalta.
- Native app bhi Firebase se **directly** baat karta hai (koi extra server nahi).
- Web build = PWA; native build = same `dist/` + WebView shell.

## 5. Functional Requirements

### A. PWA layer

| ID     | Requirement |
| ------ | ----------- |
| FR-P1  | Valid `manifest.webmanifest` ho: name, short_name, `display: standalone`, theme/background color, 192/512 icons + maskable. |
| FR-P2  | Service worker `autoUpdate` mode mein ho; naya deploy aane par next launch par app update ho jaye. |
| FR-P3  | App shell (HTML/JS/CSS/images) precache ho — network band hone par bhi app khule, "You're offline" state dikhe. |
| FR-P4  | Android Chrome par install prompt available ho; iOS par "Add to Home Screen" instructions dikhein. |
| FR-P5  | `index.html` mein `apple-touch-icon`, `theme-color`, `viewport-fit=cover` ho. |
| FR-P6  | Native shell mein service worker register **na** ho (double-cache se bachne ke liye). |

### B. Native shell

| ID     | Requirement |
| ------ | ----------- |
| FR-N1  | `capacitor.config.ts` ho: appId `com.webufire.foodiehub`, appName `Foodie Hub`, `webDir: dist`. |
| FR-N2  | Splash screen + adaptive icon (Android) + AppIcon set (iOS) ek hi 1024×1024 source se generate hon. |
| FR-N3  | Android hardware **back button** route-aware ho: inner page par `navigate(-1)`, home par confirm-to-exit. |
| FR-N4  | Safe-area insets respect hon (`env(safe-area-inset-*)`) — navbar notch/status bar ke neeche na chhupe. |
| FR-N5  | Status bar theme se match kare (dark/light toggle ke saath update). |
| FR-N6  | Native platform par `target="_blank"` / external links system browser mein khulein. |
| FR-N7  | Firestore offline persistence enable ho — network jaane par menu/cart/orders cache se chalein. |

### C. Auth + deep links

| ID     | Requirement |
| ------ | ----------- |
| FR-A1  | Native mein Google sign-in `signInWithPopup` use na kare — redirect/native flow ho. |
| FR-A2  | Firebase Auth authorized domains mein `https://localhost` (Capacitor origin) ho. |
| FR-A3  | Sign-in ke baad app sahi route par wapas aaye (redirect result handle ho). |
| FR-A4  | `/restaurant/:id` deep link (Android App Links + iOS Universal Links) se app khule. |
| FR-A5  | Web par behavior exactly pehle jaisa rahe (koi regression nahi). |

### D. Automation + release

| ID     | Requirement |
| ------ | ----------- |
| FR-D1  | `npm run app:setup` ek baar platforms add kare (idempotent ho, dobara chalane par na toote). |
| FR-D2  | `npm run app:icons` source image se saare icon/splash generate kare. |
| FR-D3  | `npm run app:sync` = `build` + version sync + `cap sync`. |
| FR-D4  | Version `package.json` se padhe aur Android `versionCode` (auto increment) + `versionName` + iOS `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION` set kare. |
| FR-D5  | `npm run app:android` signed **release AAB** banaye (keystore secrets se, repo mein na ho). |
| FR-D6  | `npm run app:android:play` AAB ko Play Console **internal track** par upload kare (service account). |
| FR-D7  | `npm run app:ios` archive banaye aur **TestFlight** par upload kare (App Store Connect API key). |
| FR-D8  | GitHub Actions workflow: `app-v*` tag push par Android AAB build + Play internal upload; manual dispatch par iOS TestFlight. |
| FR-D9  | Existing web pipeline unchanged rahe — `npm run deploy` sirf hosting + rules deploy kare. |
| FR-D10 | Secrets (keystore, Play service account, ASC key) sirf CI secrets / local untracked file mein; `.gitignore` verify ho. |
| FR-D11 | Har release ke baad `rfp/evidence/` mein screenshot + build number add ho (existing convention). |## 6. Non-Functional Requirements

- **Cost:** Spark plan; store accounts one-time (Play $25, Apple $99/yr) — code side ₹0.
- **Bundle size:** AAB ≤ 15 MB (web assets ~1–2 MB + shell); iOS ipa ≤ 25 MB.
- **Cold start:** splash → first paint ≤ 3s mid-range Android.
- **Offline:** app shell + last-viewed restaurants/menu cache se khule.
- **Security:** keystore/API keys kabhi commit na hon; Firebase rules unchanged.
- **Store compliance:** food = physical goods, isliye external payment allowed
  (Apple 3.1.3 / Play Payments policy). Apple 4.2 (minimum functionality) ke liye
  offline + install + deep links jaise native touches zaroori hain.
- **Compatibility:** Android 8+ (minSdk 26), iOS 15+.
- **Maintainability:** koi native code fork na ho — web code hi single source of truth rahe.

## 7. One-time manual tasks (automate nahi ho sakte)

| # | Task | Kyun manual | Cost |
| - | ---- | ----------- | ---- |
| 1 | Play Console account + app create + **first AAB manual upload** | Google policy: naye app ka pehla release console se hi | $25 one-time |
| 2 | Apple Developer Program + App Store Connect app record | Apple account verification | $99/yr |
| 3 | Keystore password + CI secrets set karna | Secret human ke paas rehna chahiye | — |
| 4 | Play/Apple review ke screenshots + privacy form bharo | Legal declaration | — |

> Note: pehla manual upload ke baad har subsequent release **automated** hai.

## 8. Automation matrix

| Kaam | Kaise | Manual? |
| ---- | ----- | ------- |
| PWA manifest + SW | `vite-plugin-pwa` config | ❌ |
| Icons + splash | `npm run app:icons` | ❌ |
| Web deploy | `npm run deploy` (already hai) | ❌ |
| Native platform add | `npm run app:setup` (one-time) | ❌ |
| Build + sync | `npm run app:sync` | ❌ |
| Version bump | `npm run app:version` (auto from package.json) | ❌ |
| Signed AAB | `npm run app:android` | ❌ |
| Play upload | `npm run app:android:play` / CI | ❌ (pehli baar ❌ exception) |
| TestFlight upload | `npm run app:ios` / CI | ❌ |
| Store account banana | Play Console / Apple | ✅ |
| Pehla AAB upload | Play Console UI | ✅ |
| Privacy form / review reply | Console | ✅ |

## 9. Acceptance Criteria

- [ ] `npm run build` ke baad `dist/` mein valid manifest + service worker milta hai.
- [ ] Chrome DevTools → Application → Manifest error-free; Lighthouse PWA installable.
- [ ] Airplane mode mein app shell khulta hai aur offline message dikhta hai.
- [ ] `npx cap sync` ke baad Android Studio project clean build hota hai.
- [ ] Android back button: inner page → previous page; home par back → exit confirm.
- [ ] Notch/status bar ke saath navbar overlap nahi karta (safe-area test).
- [ ] Native Google sign-in kaam karta hai aur user wapas same page par aata hai.
- [ ] Deep link `https://webufire.web.app/restaurant/<id>` app mein correct restaurant kholta hai.
- [ ] `npm run app:version` chalane par package.json + Android + iOS versions sync hote hain.
- [ ] `npm run app:android` signed AAB produce karta hai (Play Console par accept hota hai).
- [ ] Tag push par GitHub Actions green hota hai aur Play internal track par build pahunchta hai.
- [ ] `npm run lint` + `npm run build` clean; web par koi console error nahi.
- [ ] `git status` mein keystore/secrets untracked nahi dikhte.

## 10. Technical Notes

| Area | File / Command |
| ---- | -------------- |
| PWA plugin + manifest | `vite.config.js` (`VitePWA`) |
| HTML meta / icons | `index.html` |
| Native config | `capacitor.config.ts` (`appId: com.webufire.foodiehub`) |
| Platform detection | `src/utils/platform.js` (`window.Capacitor`, web bundle se bahar) |
| Back button / status bar | `src/components/NativeBridge.jsx` (lazy chunk) |
| Install prompt | `src/components/InstallPrompt.jsx` |
| Offline banner | `src/components/OfflineBanner.jsx` |
| Auth redirect | `src/services/authService.js`, `src/context/AuthProvider.jsx` |
| Routes (deep link) | `src/App.jsx` |
| Safe-area CSS | `src/index.css` |
| Firestore cache | `src/services/firebase.js` |
| Icon/splash generator | `scripts/generate-app-icons.mjs` → `public/` + `assets/` |
| Version sync script | `scripts/sync-app-version.mjs` |
| Signing patch | `scripts/patch-android-signing.mjs` |
| Deep-link files | `scripts/generate-app-links.mjs` |
| Play upload | `scripts/upload-play.mjs` (zero dependency, JWT + REST) |
| iOS build/upload | `scripts/build-ios.mjs` |
| Keystore script | `scripts/create-keystore.sh` (local only) |
| Setup script | `scripts/app-setup.mjs` |
| Release scripts | `package.json` (`app:*`) |
| CI | `.github/workflows/app-release.yml` |
| Runbook | `docs/APP_RELEASE.md` |

Actual npm scripts:

```json
{
  "app:setup": "node scripts/app-setup.mjs",
  "app:icons": "node scripts/generate-app-icons.mjs",
  "app:assets": "capacitor-assets generate --assetPath assets --ios --android",
  "app:version": "node scripts/sync-app-version.mjs",
  "app:links": "node scripts/generate-app-links.mjs",
  "app:sync": "npm run build && npm run app:version && cap sync",
  "app:android": "npm run app:sync && cd android && ./gradlew bundleRelease",
  "app:android:play": "node scripts/upload-play.mjs",
  "app:ios": "node scripts/build-ios.mjs",
  "app:release": "npm run app:android && npm run app:android:play"
}
```

## 10.1 Implementation status (17 Nov 2026)

| Requirement | Status |
| ----------- | ------ |
| PWA manifest + service worker + offline shell | ✅ code complete (`npm run build` verified) |
| Install prompt (Android + iOS hint) | ✅ |
| Capacitor Android + iOS projects | ✅ generated (`android/`, `ios/`), `cap sync` verified |
| Back button / status bar / splash / safe areas | ✅ code complete (device test pending) |
| Native Google redirect flow | ✅ code complete (Firebase `localhost` domain pending) |
| Firestore offline persistence | ✅ code complete |
| Version sync / signing patch | ✅ `app:version` verified |
| Play upload / iOS TestFlight scripts | ✅ written (accounts + secrets pending) |
| CI workflow | ✅ written (secrets pending) |
| Icon + splash assets | ✅ generated from brand mark |
| Device/emulator release test | ⏳ Play/Apple account setup ke baad |

> Jo cheezein "pending" hain wo sirf external accounts (Play Console, Apple Developer,
> Firebase authorized domain) par depend karti hain — code side complete hai.

## 11. Risks

| Risk | Mitigation |
| ---- | ---------- |
| Play first upload manual hai | RFP mein pehle din ka manual checklist |
| Apple 4.2 se reject (sirf website wrapper) | Offline + back button + deep links + splash = native feel |
| Service worker + WebView double cache | Native par SW register skip (FR-P6) |
| Google popup sign-in WebView mein fail | Redirect/native flow (FR-A1) |
| Firebase Auth origin block | `https://localhost` authorized domain (FR-A2) |
| Keystore kho gaya = app update na ho payega | Play App Signing + password manager + backup |
| iOS build ke liye Mac chahiye | Local Mac available; CI macOS runner optional (costly) |

## 12. Future Enhancements

- Push notifications (FCM Android + APNs iOS).
- Payments (Razorpay/UPI intent) — native mein deep link.
- Cart badge par app icon badge (Android `shortcut` badging).
- Widget / quick reorder shortcut.
- Tablet layout + foldable support.
- OTA JS updates (Capacitor live update) — store policy review ke baad.
