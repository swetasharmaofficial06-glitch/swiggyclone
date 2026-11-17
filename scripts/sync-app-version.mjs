/**
 * Version sync — `package.json` (ya APP_VERSION env) se native projects update karta hai.
 *
 *   npm run app:version
 *   APP_VERSION=1.2.0 APP_BUILD_NUMBER=42 npm run app:version
 *
 * - Android: `android/app/build.gradle` → versionName / versionCode
 * - iOS: `ios/App/App.xcodeproj/project.pbxproj` → MARKETING_VERSION / CURRENT_PROJECT_VERSION
 *
 * versionCode hamesha badhta hai (major*10000 + minor*100 + patch vs APP_BUILD_NUMBER mein se bada).
 * Play Store ek hi versionCode dobara accept nahi karta — isliye monotonic hona zaroori hai.
 */
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'))

const version = String(process.env.APP_VERSION || pkg.version).replace(/^v/, '').trim()
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`✗ Invalid version "${version}" — semver (1.2.3) chahiye.`)
  process.exit(1)
}

const [major, minor, patch] = version.split('.').map(Number)
const semverCode = major * 10000 + minor * 100 + patch
const override = Number(process.env.APP_BUILD_NUMBER)
const versionCode = Math.max(semverCode, Number.isFinite(override) ? override : 0)

const results = []

/* ---------- Android ---------- */

const gradlePath = path.join(ROOT, 'android/app/build.gradle')
if (existsSync(gradlePath)) {
  const original = await readFile(gradlePath, 'utf8')
  let next = original
    .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
    .replace(/versionName\s+"[^"]*"/, `versionName "${version}"`)

  if (next !== original) {
    await writeFile(gradlePath, next)
    results.push(`android/app/build.gradle → ${version} (${versionCode})`)
  } else {
    results.push('android/app/build.gradle → already in sync')
  }
} else {
  results.push('android/ missing — `npm run app:setup` chalao (skip)')
}

/* ---------- iOS ---------- */

const pbxprojPath = path.join(ROOT, 'ios/App/App.xcodeproj/project.pbxproj')
if (existsSync(pbxprojPath)) {
  const original = await readFile(pbxprojPath, 'utf8')
  const next = original
    .replace(/(MARKETING_VERSION = )[^;]+;/g, (_m, prefix) => `${prefix}${version};`)
    .replace(
      /(CURRENT_PROJECT_VERSION = )[^;]+;/g,
      (_m, prefix) => `${prefix}${versionCode};`,
    )

  if (next !== original) {
    await writeFile(pbxprojPath, next)
    results.push(`ios/App/App.xcodeproj → ${version} (${versionCode})`)
  } else {
    results.push('ios/App/App.xcodeproj → already in sync')
  }
} else {
  results.push('ios/ missing — `npm run app:setup` chalao (skip)')
}

console.log(`✓ Version ${version} (build ${versionCode})`)
for (const line of results) console.log(`  - ${line}`)
