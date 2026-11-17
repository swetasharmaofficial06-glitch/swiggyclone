# App Release Runbook — Foodie Hub

Ye guide **website (PWA) + native app (Capacitor)** dono ke build/release ke liye hai.
Requirement detail: `rfp/requirements-website2app.md`

## 1. Kya ban raha hai

| Artifact | Kaise | Kahan jaata hai |
| -------- | ----- | --------------- |
| Web + PWA | `npm run deploy` | Firebase Hosting (`webufire.web.app`) |
| Android app | `npm run app:android` | Play Store (AAB) |
| iOS app | `npm run app:ios` | TestFlight / App Store |

Backend, Firestore rules, auth — sab same rehta hai. Native app bhi Firebase se direct baat karta hai.

## 2. Ek baar ka setup

```bash
npm install
npm run app:icons     # icons + splash (public/ + assets/)
npm run app:setup     # android/ + ios/ add, signing patch, deep-link files
npm run app:sync      # build + version + cap sync

npx cap open android  # Android Studio
npx cap open ios      # Xcode
```

> `android/` aur `ios/` folders **git mein commit hote hain** (native project source).
> Build outputs, keystore, Pods, DerivedData ignore hain.

### Firebase Auth (native Google sign-in)

Capacitor native shell ka origin `https://localhost` hota hai. Firebase Console →
**Authentication → Settings → Authorized domains** mein `localhost` add karo
(`webufire.web.app` aur `webufire.firebaseapp.com` pehle se hone chahiye).

Native mein popup supported nahi hai — code automatically `signInWithRedirect` use karta hai
(`src/services/authService.js`).

## 3. Commands

| Command | Kaam |
| ------- | ---- |
| `npm run app:icons` | Source mark se PWA icons + Capacitor icon/splash |
| `npm run app:assets` | `assets/` se Android adaptive icon + iOS AppIcon generate |
| `npm run app:setup` | Platforms add (idempotent) + signing patch + links |
| `npm run app:version` | `package.json` → Android/iOS version sync |
| `npm run app:sync` | `build` + version + `cap sync` |
| `npm run app:android` | Signed release **AAB** |
| `npm run app:android:play` | AAB ko Play track par upload |
| `npm run app:ios` | Archive + `.ipa` export (+ optional TestFlight) |
| `npm run app:release` | Android build + Play upload |
| `npm run app:links` | `assetlinks.json` + `apple-app-site-association` |

Version bump karke release:

```bash
npm version patch          # package.json 0.1.0 → 0.1.1
npm run app:release        # build + upload (Play account + secrets ke saath)
```

Build number override: `APP_BUILD_NUMBER=42 npm run app:version`

## 4. Keystore (sirf Android release)

```bash
ANDROID_KEYSTORE_PASSWORD='strong-pass' \
ANDROID_KEY_PASSWORD='strong-pass' \
./scripts/create-keystore.sh
```

Ye banata hai `foodiehub-release.jks` (gitignored). Iska backup password manager mein rakho —
kho gaya to Play Store par app **dobara update nahi hoga**.

Local signed build:

```bash
export ANDROID_KEYSTORE_PATH="$PWD/foodiehub-release.jks"
export ANDROID_KEYSTORE_PASSWORD='...'
export ANDROID_KEY_ALIAS='foodiehub'
export ANDROID_KEY_PASSWORD='...'
npm run app:android
```

CI ke liye: `base64 -i foodiehub-release.jks` → GitHub secret `ANDROID_KEYSTORE_BASE64`.

## 5. GitHub secrets

| Secret | Kya hai |
| ------ | ------- |
| `VITE_FIREBASE_*` (6) | Web build ke Firebase config |
| `ANDROID_KEYSTORE_BASE64` | Release keystore ka base64 |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias (`foodiehub`) |
| `ANDROID_KEY_PASSWORD` | Key password |
| `PLAY_SERVICE_ACCOUNT_JSON` | Play Console service account JSON (base64 ya raw) |
| `IOS_TEAM_ID` | Apple Developer Team ID |
| `ASC_KEY_ID` / `ASC_ISSUER_ID` | App Store Connect API key |
| `ASC_KEY_P8` | ASC `.p8` key ka base64 |

Workflow: `.github/workflows/app-release.yml`
- `app-v*` tag push → Android AAB + Play upload
- Manual dispatch → iOS TestFlight bhi

## 6. Pehli release checklist (manual)

Ye 4 cheezein automate nahi hoti:

- [ ] Play Console account ($25) + app create
- [ ] **Pehla AAB manually upload** (Google policy; uske baad `app:android:play` se auto)
- [ ] Apple Developer ($99/yr) + App Store Connect app record
- [ ] Store listing screenshots + privacy form
- [ ] Firebase Auth mein `localhost` authorized domain
- [ ] Deep links ke liye fingerprint/team ID: `ANDROID_SHA256_FINGERPRINTS` + `IOS_TEAM_ID` ke saath `npm run app:links` (deploy se pehle)

## 7. Deep links

| Platform | File | Env |
| -------- | ---- | --- |
| Android | `public/.well-known/assetlinks.json` | `ANDROID_SHA256_FINGERPRINTS` |
| iOS | `public/.well-known/apple-app-site-association` | `IOS_TEAM_ID` |

Fingerprint nikalne ke liye:

```bash
keytool -list -v -keystore foodiehub-release.jks -alias foodiehub | grep SHA256
```

Files generate hone ke baad `npm run deploy` — hosting se verify ho jayengi.

## 8. Troubleshooting

| Problem | Fix |
| ------- | --- |
| `cap sync` ke baad purana UI | native shell mein service worker register nahi hota; `npx cap sync` dobara chalao |
| Google sign-in native mein fail | Firebase Auth mein `localhost` domain add karo; `https://localhost` origin check karo |
| Gradle "keystore not found" | `ANDROID_KEYSTORE_PATH` absolute path do; `npm run app:setup` se signing patch check karo |
| Play upload 401/403 | service account ko Play Console → Users & permissions mein **Release manager** access do |
| iOS archive signing error | Xcode mein team select karo ya `IOS_TEAM_ID` env do |
| `app:version` ne iOS update nahi kiya | pehle `npm run app:setup` (ios/ folder generate) |
