/**
 * Android release signing patch — Capacitor ke `android/app/build.gradle` mein
 * env-based release signing config add karta hai (idempotent).
 *
 *   npm run app:android   # keystore env vars ke saath
 *
 * Required env (sirf release build ke liye):
 *   ANDROID_KEYSTORE_PATH      absolute path (CI mein decode karke)
 *   ANDROID_KEYSTORE_PASSWORD
 *   ANDROID_KEY_ALIAS
 *   ANDROID_KEY_PASSWORD
 *
 * Env missing ho to AAB unsigned banega — Play Store accept nahi karega.
 * Local testing ke liye `npx cap run android` (debug build) use karo.
 *
 * Note: Capacitor 8 ke template mein `signingConfigs` block hota hi nahi,
 * isliye script use khud add karta hai. Purane template (debug signing) bhi handle hote hain.
 */
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const gradlePath = path.join(process.cwd(), 'android/app/build.gradle')
const MARKER = '// <foodiehub-release-signing>'

if (!existsSync(gradlePath)) {
  console.log('• android/ project nahi hai — `npm run app:setup` pehle chalao. Skip.')
  process.exit(0)
}

let gradle = await readFile(gradlePath, 'utf8')

if (gradle.includes(MARKER)) {
  console.log('✓ Signing patch pehle se laga hua hai. Skip.')
  process.exit(0)
}

const signingConfigs = `
    ${MARKER}
    // Release keystore env vars se aata hai — password repo mein kabhi nahi.
    signingConfigs {
        release {
            storeFile file(System.getenv('ANDROID_KEYSTORE_PATH') ?: 'release.keystore')
            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
            keyAlias System.getenv('ANDROID_KEY_ALIAS')
            keyPassword System.getenv('ANDROID_KEY_PASSWORD')
        }
    }
`

if (!/signingConfigs\s*\{/.test(gradle)) {
  // Capacitor 8 template: koi signingConfigs block nahi — `android {` ke andar add karo.
  gradle = gradle.replace(/android\s*\{/, (match) => `${match}\n${signingConfigs}`)
}

const signingLine =
  "signingConfig System.getenv('ANDROID_KEYSTORE_PATH') ? signingConfigs.release : null"

if (/signingConfig\s+signingConfigs\.debug/.test(gradle)) {
  // Purana template: release debug key se sign hota tha.
  gradle = gradle.replace(/signingConfig\s+signingConfigs\.debug/, signingLine)
} else if (!/signingConfig\s+/.test(gradle)) {
  gradle = gradle.replace(/buildTypes\s*\{\s*release\s*\{/, (match) => `${match}\n            ${signingLine}`)
}

await writeFile(gradlePath, gradle)
console.log('✓ android/app/build.gradle mein release signing config add ho gaya.')

if (!process.env.ANDROID_KEYSTORE_PATH) {
  console.log(
    '  ⚠ ANDROID_KEYSTORE_PATH set nahi hai — release AAB unsigned banega.\n' +
      '    Signed build ke liye: ./scripts/create-keystore.sh, phir env vars export karo.',
  )
}
