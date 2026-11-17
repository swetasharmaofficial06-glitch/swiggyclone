/**
 * Deep link verification files — `public/.well-known/` mein generate karta hai.
 *
 *   ANDROID_SHA256_FINGERPRINTS="AA:BB:..." IOS_TEAM_ID=ABCDE12345 npm run app:links
 *
 * - `assetlinks.json` → Android App Links (`/restaurant/:id` share link app mein khule)
 * - `apple-app-site-association` → iOS Universal Links
 *
 * Values release keystore/team ke hote hain, isliye env se aate hain — hardcode nahi.
 * Env missing ho to script files nahi likhti (galat verification file deploy na ho).
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const WELL_KNOWN = path.join(ROOT, 'public/.well-known')

const teamId = process.env.IOS_TEAM_ID
const fingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) => (value.includes(':') ? value : value.match(/.{2}/g)?.join(':') ?? value))

let appId = 'com.webufire.foodiehub'
const configPath = path.join(ROOT, 'capacitor.config.ts')
if (existsSync(configPath)) {
  const config = await readFile(configPath, 'utf8')
  const match = config.match(/appId:\s*['"]([^'"]+)['"]/)
  if (match) appId = match[1]
}

if (fingerprints.length === 0 && !teamId) {
  console.log('• ANDROID_SHA256_FINGERPRINTS / IOS_TEAM_ID nahi mile — deep link files skip.')
  console.log('  Release keystore ka fingerprint: keytool -list -v -keystore <file> | grep SHA256')
  process.exit(0)
}

await mkdir(WELL_KNOWN, { recursive: true })

if (fingerprints.length > 0) {
  const assetlinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: { namespace: 'android_app', package_name: appId, sha256_cert_fingerprints: fingerprints },
    },
  ]
  await writeFile(
    path.join(WELL_KNOWN, 'assetlinks.json'),
    `${JSON.stringify(assetlinks, null, 2)}\n`,
  )
  console.log('✓ public/.well-known/assetlinks.json')
}

if (teamId) {
  const aasa = {
    applinks: {
      details: [
        {
          appID: `${teamId}.${appId}`,
          components: [
            { '/': '/', comment: 'Home' },
            { '/': '/restaurant/*', comment: 'Restaurant deep link' },
            { '/': '/orders' },
            { '/': '/addresses' },
          ],
        },
      ],
    },
  }
  await writeFile(
    path.join(WELL_KNOWN, 'apple-app-site-association'),
    `${JSON.stringify(aasa, null, 2)}\n`,
  )
  console.log('✓ public/.well-known/apple-app-site-association')
}

console.log('  Ab `npm run deploy` se ye files hosting par chali jayengi.')
